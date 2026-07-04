import Collection, { ICollection } from "../models/collection.model.js";

export class CollectionRepository {
  async findById(id: string): Promise<ICollection | null> {
    return Collection.findById(id);
  }

  async findBySlug(slug: string): Promise<ICollection | null> {
    return Collection.findOne({ slug });
  }

  async findByName(name: string): Promise<ICollection | null> {
    return Collection.findOne({ name });
  }

  async create(data: Partial<ICollection>): Promise<ICollection> {
    const item = new Collection(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<ICollection>): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<ICollection | null> {
    return Collection.findByIdAndDelete(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(
      id,
      { status: "archived", deletedAt: new Date(), deletedBy },
      { new: true }
    );
  }

  async restore(id: string): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(
      id,
      { status: "active", deletedAt: null, deletedBy: null },
      { new: true }
    );
  }

  async findAll(filter: Record<string, any> = {}): Promise<ICollection[]> {
    return Collection.find({ ...filter, deletedAt: null });
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

    // Exclude soft-deleted items by default
    if (!options.includeArchived) {
      query.deletedAt = null;
      query.status = { $ne: "archived" };
    }

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
      Collection.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .lean(),
      Collection.countDocuments(query),
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

export const collectionRepository = new CollectionRepository();
export default collectionRepository;
