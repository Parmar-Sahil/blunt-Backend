import Product, { IProduct, IImage } from "../models/product.model.js";
import mongoose from "mongoose";

export class ProductRepository {
  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate("categoryId").populate("collectionId");
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug }).populate("categoryId").populate("collectionId");
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ "variants.sku": sku }).populate("categoryId").populate("collectionId");
  }

  async create(data: Partial<IProduct>): Promise<IProduct> {
    const item = new Product(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IProduct | null> {
    return Product.findByIdAndDelete(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      id,
      { status: "archived", deletedAt: new Date(), updatedBy: deletedBy },
      { new: true }
    );
  }

  async restore(id: string): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      id,
      { status: "draft", deletedAt: null },
      { new: true }
    );
  }

  async addImage(id: string, image: IImage): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      id,
      { $push: { images: image } },
      { new: true }
    );
  }

  async removeImage(productId: string, imageId: string): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      productId,
      { $pull: { images: { _id: new mongoose.Types.ObjectId(imageId) } } },
      { new: true }
    );
  }

  async findPaginated(options: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    collectionId?: string;
    labels?: string[];
    status?: string;
    visibility?: string;
    color?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    sortBy?: string;
    includeArchived?: boolean;
    fields?: string;
  }) {
    const query: Record<string, any> = {};

    // Exclude soft-deleted items by default
    if (!options.includeArchived) {
      query.deletedAt = null;
      query.status = { $ne: "archived" };
    }

    if (options.categoryId) {
      query.categoryId = new mongoose.Types.ObjectId(options.categoryId);
    }

    if (options.collectionId) {
      query.collectionId = new mongoose.Types.ObjectId(options.collectionId);
    }

    if (options.status) {
      query.status = options.status;
    }

    if (options.visibility) {
      query.visibility = options.visibility;
    }

    if (options.labels && options.labels.length > 0) {
      query.labels = { $in: options.labels };
    }

    if (options.color) {
      query["variants.color"] = options.color;
    }

    if (options.size) {
      query["variants.size"] = options.size;
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      query.price = {};
      if (options.minPrice !== undefined) query.price.$gte = options.minPrice;
      if (options.maxPrice !== undefined) query.price.$lte = options.maxPrice;
    }

    if (options.availability !== undefined) {
      if (options.availability) {
        query["variants.availableStock"] = { $gt: 0 };
      } else {
        query["variants.availableStock"] = { $lte: 0 };
      }
    }

    // Search query matches using text search or regex
    if (options.search) {
      query.$text = { $search: options.search };
    }

    // Sorting
    let sortOptions: Record<string, any> = { displayPriority: -1, createdAt: -1 };
    if (options.sortBy) {
      switch (options.sortBy) {
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        case "price-asc":
          sortOptions = { price: 1 };
          break;
        case "price-desc":
          sortOptions = { price: -1 };
          break;
        case "stock-asc":
          sortOptions = { "variants.stock": 1 };
          break;
        case "stock-desc":
          sortOptions = { "variants.stock": -1 };
          break;
        case "priority":
          sortOptions = { displayPriority: -1 };
          break;
      }
    }

    const skip = (options.page - 1) * options.limit;
    
    // Support custom projection fields
    let projection: any = {};
    if (options.fields) {
      options.fields.split(",").forEach((f) => {
        projection[f.trim()] = 1;
      });
    }

    const [items, total] = await Promise.all([
      Product.find(query, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .populate("categoryId")
        .populate("collectionId")
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / options.limit);

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
    };
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
