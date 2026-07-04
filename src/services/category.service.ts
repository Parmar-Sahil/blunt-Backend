import categoryRepository from "../repositories/category.repository.js";
import { ICategory } from "../models/category.model.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";

// Helper slugify function
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
}

export class CategoryService {
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await categoryRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    return slug;
  }

  async createCategory(data: Partial<ICategory> & { actorId?: string }): Promise<ICategory> {
    const existingName = await categoryRepository.findByName(data.name!);
    if (existingName) {
      throw new ConflictError("CATEGORY WITH THIS NAME ALREADY EXISTS");
    }

    if (data.slug) {
      data.slug = slugify(data.slug);
      const existingSlug = await categoryRepository.findBySlug(data.slug);
      if (existingSlug) {
        throw new ConflictError("CATEGORY WITH THIS SLUG ALREADY EXISTS");
      }
    } else {
      data.slug = await this.generateUniqueSlug(data.name!);
    }

    data.createdBy = data.actorId || "system";
    data.updatedBy = data.actorId || "system";

    // TODO: Cloudinary Images - Upload category banner/icon to Cloudinary bucket
    // TODO: AI Category Suggestions - Auto-categorization recommendations
    // TODO: Analytics - Record category creation metric

    const item = await categoryRepository.create(data);
    console.log(`[LOG] Category Created: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async updateCategory(id: string, updateData: Partial<ICategory> & { actorId?: string }): Promise<ICategory> {
    const category = await categoryRepository.findById(id);
    if (!category || category.deletedAt) {
      throw new NotFoundError("CATEGORY NOT FOUND OR HAS BEEN ARCHIVED");
    }

    if (updateData.name && updateData.name !== category.name) {
      const existingName = await categoryRepository.findByName(updateData.name);
      if (existingName) {
        throw new ConflictError("CATEGORY WITH THIS NAME ALREADY EXISTS");
      }
    }

    if (updateData.slug && updateData.slug !== category.slug) {
      updateData.slug = slugify(updateData.slug);
      const existingSlug = await categoryRepository.findBySlug(updateData.slug);
      if (existingSlug) {
        throw new ConflictError("CATEGORY WITH THIS SLUG ALREADY EXISTS");
      }
    }

    updateData.updatedBy = updateData.actorId || "system";

    // TODO: Cloudinary Images - Update asset references
    // TODO: Recommendation Engine - Re-rank products display order

    const item = await categoryRepository.update(id, updateData);
    if (!item) throw new NotFoundError("CATEGORY NOT FOUND");

    console.log(`[LOG] Category Updated: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async getCategoryById(id: string): Promise<ICategory> {
    const item = await categoryRepository.findById(id);
    if (!item || item.deletedAt) throw new NotFoundError("CATEGORY NOT FOUND");
    return item;
  }

  async getCategoryBySlug(slug: string): Promise<ICategory> {
    const item = await categoryRepository.findBySlug(slug);
    if (!item || item.deletedAt) throw new NotFoundError("CATEGORY NOT FOUND");
    return item;
  }

  async listCategories(filter: Record<string, any> = {}): Promise<ICategory[]> {
    return categoryRepository.findAll(filter);
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
    return categoryRepository.findPaginated(options);
  }

  async archiveCategory(id: string, actorId: string): Promise<ICategory> {
    const item = await categoryRepository.softDelete(id, actorId);
    if (!item) throw new NotFoundError("CATEGORY NOT FOUND");
    console.log(`[LOG] Category Archived: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async restoreCategory(id: string): Promise<ICategory> {
    const item = await categoryRepository.restore(id);
    if (!item) throw new NotFoundError("CATEGORY NOT FOUND");
    console.log(`[LOG] Category Restored: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async deleteCategory(id: string): Promise<void> {
    const item = await categoryRepository.delete(id);
    if (!item) throw new NotFoundError("CATEGORY NOT FOUND");
  }
}

export const categoryService = new CategoryService();
export default categoryService;
