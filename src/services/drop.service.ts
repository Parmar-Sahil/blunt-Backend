import Drop, { IDrop } from "../models/drop.model.js";
import Product from "../models/product.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

export const dropService = {
  /**
   * Automatically calculates the next safe sequential Drop number from the database.
   * Never reuses numbers, ensuring strict uniqueness.
   */
  async getNextDropNumber(): Promise<{ nextNumber: number; displayNumber: string; formattedDropNumber: string }> {
    // Find highest drop number ever recorded (including archived or soft-deleted)
    const highestDrop = await Drop.findOne({})
      .sort({ dropNumber: -1 })
      .select("dropNumber")
      .lean();

    const nextNumber = (highestDrop?.dropNumber || 0) + 1;
    const formatted = nextNumber < 10 ? `00${nextNumber}` : nextNumber < 100 ? `0${nextNumber}` : `${nextNumber}`;

    return {
      nextNumber,
      displayNumber: `DROP ${formatted}`,
      formattedDropNumber: formatted,
    };
  },

  /**
   * Get the single latest active Drop populated with all associated standard products
   */
  async getLatestDrop(): Promise<IDrop | null> {
    let latestDrop = await Drop.findOne({
      status: "active",
      deletedAt: null,
    })
      .sort({ isLatest: -1, dropNumber: -1, createdAt: -1 })
      .populate({
        path: "productIds",
        match: { deletedAt: null },
        populate: {
          path: "categoryId",
          select: "name slug",
        },
      })
      .exec();

    // If no drop exists in DB, auto-seed initial Drop 001
    if (!latestDrop) {
      const existingAny = await Drop.findOne({ deletedAt: null });
      if (!existingAny) {
        const topProducts = await Product.find({ deletedAt: null }).limit(4);
        const topProductIds = topProducts.map((p) => p._id);

        latestDrop = await Drop.create({
          dropNumber: 1,
          displayNumber: "DROP 001",
          formattedDropNumber: "001",
          name: "Obsidian",
          title: "Drop 001 // Obsidian Edition",
          slug: "drop-001",
          subtitle: "Monochromatic Heavyweight Streetwear",
          description:
            "The inaugural BLUNT release. Crafted from 240 GSM heavy carded cotton with brutalist silicone typography and high-contrast editorial cuts.",
          heroImage:
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1920&auto=format&fit=crop",
          galleryImages: [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600",
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600",
          ],
          productIds: topProductIds,
          status: "active",
          isLatest: true,
          releaseDate: new Date(),
        });

        latestDrop = await Drop.findById(latestDrop._id)
          .populate({
            path: "productIds",
            match: { deletedAt: null },
            populate: {
              path: "categoryId",
              select: "name slug",
            },
          })
          .exec();
      }
    }

    // Fallback: If active drop has 0 linked products, link top store products dynamically
    if (latestDrop && (!latestDrop.productIds || latestDrop.productIds.length === 0)) {
      const topProducts = await Product.find({ deletedAt: null }).limit(4);
      if (topProducts.length > 0) {
        latestDrop.productIds = topProducts as any;
      }
    }

    return latestDrop;
  },

  /**
   * List all drops (for Admin and Archive)
   */
  async getAllDrops(query: any = {}): Promise<{ items: IDrop[]; total: number }> {
    const filter: any = { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
    }

    const total = await Drop.countDocuments(filter);
    const items = await Drop.find(filter)
      .sort({ dropNumber: -1, createdAt: -1 })
      .populate({
        path: "productIds",
        select: "name price thumbnail images variants status visibility",
      })
      .exec();

    return { items, total };
  },

  /**
   * Get a single drop by ID or slug
   */
  async getDropById(idOrSlug: string): Promise<IDrop | null> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const filter = isObjectId
      ? { _id: idOrSlug, deletedAt: null }
      : { slug: idOrSlug, deletedAt: null };

    const drop = await Drop.findOne(filter)
      .populate({
        path: "productIds",
        match: { deletedAt: null },
        populate: {
          path: "categoryId",
          select: "name slug",
        },
      })
      .exec();

    return drop;
  },

  /**
   * Create a new Drop with automatic sequential numbering
   */
  async createDrop(data: any): Promise<IDrop> {
    // 1. Calculate next sequential drop number safely on backend
    const { nextNumber, displayNumber, formattedDropNumber } = await this.getNextDropNumber();

    const isMakeActive = data.status === "active" || data.isLatest === true;

    // 2. If activating this drop, demote all other drops
    if (isMakeActive) {
      await Drop.updateMany({ _id: { $ne: null } }, { isLatest: false });
    }

    // 3. Create drop document
    const gallery = data.galleryImages || data.secondaryImages || [];

    const drop = new Drop({
      dropNumber: nextNumber,
      displayNumber,
      formattedDropNumber,
      name: data.name || `Drop ${formattedDropNumber}`,
      title: data.title || `Drop ${formattedDropNumber} // Special Edition`,
      slug: `drop-${formattedDropNumber}`,
      subtitle: data.subtitle || "",
      description: data.description || "",
      heroImage: data.heroImage,
      galleryImages: gallery,
      productIds: data.productIds || [],
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
      status: data.status || "draft",
      isLatest: isMakeActive,
      createdBy: data.createdBy || "system",
      updatedBy: data.updatedBy || "system",
    });

    const saved = await drop.save();
    return saved;
  },

  /**
   * Update an existing Drop
   */
  async updateDrop(id: string, data: any): Promise<IDrop> {
    const drop = await Drop.findOne({ _id: id, deletedAt: null });
    if (!drop) {
      throw new NotFoundError("DROP NOT FOUND");
    }

    const isMakeActive = data.status === "active" || data.isLatest === true;

    if (isMakeActive) {
      await Drop.updateMany({ _id: { $ne: id } }, { isLatest: false });
    }

    // Drop number cannot be mutated
    delete data.dropNumber;
    delete data.displayNumber;
    delete data.formattedDropNumber;

    if (data.galleryImages || data.secondaryImages) {
      data.galleryImages = data.galleryImages || data.secondaryImages;
    }

    Object.assign(drop, data);
    return await drop.save();
  },

  /**
   * Activate a Drop and set it as the latest active drop
   */
  async activateDrop(id: string): Promise<IDrop> {
    const drop = await Drop.findOne({ _id: id, deletedAt: null });
    if (!drop) {
      throw new NotFoundError("DROP NOT FOUND");
    }

    // Demote all other drops
    await Drop.updateMany({ _id: { $ne: id } }, { isLatest: false });

    drop.status = "active";
    drop.isLatest = true;
    return await drop.save();
  },

  /**
   * Archive a Drop
   */
  async archiveDrop(id: string): Promise<IDrop> {
    const drop = await Drop.findOne({ _id: id, deletedAt: null });
    if (!drop) {
      throw new NotFoundError("DROP NOT FOUND");
    }

    drop.status = "archived";
    drop.isLatest = false;
    return await drop.save();
  },

  /**
   * Delete a drop (soft-delete, products remain untouched)
   */
  async deleteDrop(id: string): Promise<void> {
    const drop = await Drop.findOne({ _id: id, deletedAt: null });
    if (!drop) {
      throw new NotFoundError("DROP NOT FOUND");
    }

    drop.deletedAt = new Date();
    drop.status = "archived";
    drop.isLatest = false;
    await drop.save();
  },
};

export default dropService;
