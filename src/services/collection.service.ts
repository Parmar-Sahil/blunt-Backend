import collectionRepository from "../repositories/collection.repository.js";
import { ICollection } from "../models/collection.model.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { slugify } from "./category.service.js";

export class CollectionService {
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await collectionRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    return slug;
  }

  async createCollection(data: Partial<ICollection> & { actorId?: string }): Promise<ICollection> {
    const existingName = await collectionRepository.findByName(data.name!);
    if (existingName) {
      throw new ConflictError("COLLECTION WITH THIS NAME ALREADY EXISTS");
    }

    if (data.slug) {
      data.slug = slugify(data.slug);
      const existingSlug = await collectionRepository.findBySlug(data.slug);
      if (existingSlug) {
        throw new ConflictError("COLLECTION WITH THIS SLUG ALREADY EXISTS");
      }
    } else {
      data.slug = await this.generateUniqueSlug(data.name!);
    }

    data.createdBy = data.actorId || "system";
    data.updatedBy = data.actorId || "system";

    // TODO: Cloudinary Images - Upload collection banner/thumbnail to Cloudinary bucket
    // TODO: AI Category Suggestions - Automatically extract keyword collections from runway datasets
    // TODO: Analytics - Log collection drop launch event

    const item = await collectionRepository.create(data);
    console.log(`[LOG] Collection Created: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async updateCollection(id: string, updateData: Partial<ICollection> & { actorId?: string }): Promise<ICollection> {
    const collection = await collectionRepository.findById(id);
    if (!collection || collection.deletedAt) {
      throw new NotFoundError("COLLECTION NOT FOUND OR HAS BEEN ARCHIVED");
    }

    if (updateData.name && updateData.name !== collection.name) {
      const existingName = await collectionRepository.findByName(updateData.name);
      if (existingName) {
        throw new ConflictError("COLLECTION WITH THIS NAME ALREADY EXISTS");
      }
    }

    if (updateData.slug && updateData.slug !== collection.slug) {
      updateData.slug = slugify(updateData.slug);
      const existingSlug = await collectionRepository.findBySlug(updateData.slug);
      if (existingSlug) {
        throw new ConflictError("COLLECTION WITH THIS SLUG ALREADY EXISTS");
      }
    }

    updateData.updatedBy = updateData.actorId || "system";

    // TODO: Cloudinary Images - Rotate old assets
    // TODO: Recommendation Engine - Link hot-items collections

    const item = await collectionRepository.update(id, updateData);
    if (!item) throw new NotFoundError("COLLECTION NOT FOUND");

    console.log(`[LOG] Collection Updated: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async getCollectionById(id: string): Promise<ICollection> {
    const item = await collectionRepository.findById(id);
    if (!item || item.deletedAt) throw new NotFoundError("COLLECTION NOT FOUND");
    return item;
  }

  async getCollectionBySlug(slug: string): Promise<ICollection> {
    const item = await collectionRepository.findBySlug(slug);
    if (!item || item.deletedAt) throw new NotFoundError("COLLECTION NOT FOUND");
    return item;
  }

  async listCollections(filter: Record<string, any> = {}): Promise<ICollection[]> {
    return collectionRepository.findAll(filter);
  }

  async listPaginated(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    isFeatured?: boolean;
    sortBy?: string;
    includeArchived?: boolean;
  }) {
    return collectionRepository.findPaginated(options);
  }

  async archiveCollection(id: string, actorId: string): Promise<ICollection> {
    const item = await collectionRepository.softDelete(id, actorId);
    if (!item) throw new NotFoundError("COLLECTION NOT FOUND");
    console.log(`[LOG] Collection Archived: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async restoreCollection(id: string): Promise<ICollection> {
    const item = await collectionRepository.restore(id);
    if (!item) throw new NotFoundError("COLLECTION NOT FOUND");
    console.log(`[LOG] Collection Restored: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async deleteCollection(id: string): Promise<void> {
    const item = await collectionRepository.delete(id);
    if (!item) throw new NotFoundError("COLLECTION NOT FOUND");
  }
}

export const collectionService = new CollectionService();
export default collectionService;
