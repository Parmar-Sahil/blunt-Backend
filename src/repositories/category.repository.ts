import Category, { ICategory } from "../models/category.model.js";

export class CategoryRepository {
  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).populate("parentCategory");
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug }).populate("parentCategory");
  }

  async findByName(name: string): Promise<ICategory | null> {
    return Category.findOne({ name });
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    const item = new Category(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(
      id,
      { status: "archived", deletedAt: new Date(), deletedBy },
      { new: true }
    );
  }

  async restore(id: string): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(
      id,
      { status: "active", deletedAt: null, deletedBy: null },
      { new: true }
    );
  }

  async findAll(filter: Record<string, any> = {}): Promise<ICategory[]> {
    return Category.find({ ...filter, deletedAt: null }).populate("parentCategory");
  }

  async findPaginated(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    isFeatured?: boolean;
    sortBy?: string;
    includeArchived?: boolean;
  }) {
    const query: Record<string, any> = {};

    // By default, exclude soft-deleted items unless includeArchived is requested
    if (!options.includeArchived) {
      query.deletedAt = null;
      query.status = { $ne: "archived" };
    }

    // Filter by specific status if requested
    if (options.status) {
      query.status = options.status;
    }

    if (options.isFeatured !== undefined) {
      query.isFeatured = options.isFeatured;
    }

    // Search query matches name, slug, or description
    if (options.search) {
      const searchRegex = new RegExp(options.search, "i");
      query.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }

    // Sorting
    let sortOptions: Record<string, any> = { displayOrder: 1, createdAt: -1 };
    if (options.sortBy) {
      switch (options.sortBy) {
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        case "az":
          sortOptions = { name: 1 };
          break;
        case "za":
          sortOptions = { name: -1 };
          break;
        case "displayOrder":
          sortOptions = { displayOrder: 1 };
          break;
      }
    }

    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Category.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .populate("parentCategory")
        .lean(),
      Category.countDocuments(query),
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

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
