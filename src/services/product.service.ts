import productRepository from "../repositories/product.repository.js";
import { IProduct, IImage } from "../models/product.model.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { slugify } from "./category.service.js";

export class ProductService {
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await productRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    return slug;
  }

  async createProduct(data: Partial<IProduct> & { actorId?: string }): Promise<IProduct> {
    if (data.slug) {
      data.slug = slugify(data.slug);
      const exists = await productRepository.findBySlug(data.slug);
      if (exists) throw new ConflictError("PRODUCT WITH THIS SLUG ALREADY EXISTS");
    } else {
      data.slug = await this.generateUniqueSlug(data.name!);
    }

    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        const skuExists = await productRepository.findBySku(variant.sku);
        if (skuExists) throw new ConflictError(`SKU '${variant.sku}' IS ALREADY IN USE`);
        
        variant.reservedStock = variant.reservedStock || 0;
        variant.availableStock = variant.stock - variant.reservedStock;
        variant.status = variant.availableStock > 0 ? "active" : "out-of-stock";
      }
    }

    data.createdBy = data.actorId || "system";
    data.updatedBy = data.actorId || "system";

    // TODO: AI Search - Generate tagging terms for advanced catalog lookups
    // TODO: Embeddings - Generate product name embeddings for vector queries
    // TODO: Recommendation Engine - Cross-sell correlations
    // TODO: Analytics - Track product discovery rates
    // TODO: Review System - Bind review relationships
    // TODO: Product Ratings - Default to 0.0 ratings
    // TODO: Inventory Forecasting - Track inventory metrics

    const item = await productRepository.create(data);
    console.log(`[LOG] Product Created: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async updateProduct(id: string, updateData: Partial<IProduct> & { actorId?: string }): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product || product.deletedAt) throw new NotFoundError("PRODUCT NOT FOUND");

    if (updateData.slug && updateData.slug !== product.slug) {
      updateData.slug = slugify(updateData.slug);
      const exists = await productRepository.findBySlug(updateData.slug);
      if (exists) throw new ConflictError("PRODUCT WITH THIS SLUG ALREADY EXISTS");
    }

    if (updateData.variants && updateData.variants.length > 0) {
      for (const variant of updateData.variants) {
        const skuExists = await productRepository.findBySku(variant.sku);
        if (skuExists && String(skuExists._id) !== id) {
          throw new ConflictError(`SKU '${variant.sku}' IS ALREADY IN USE`);
        }
        variant.reservedStock = variant.reservedStock || 0;
        variant.availableStock = variant.stock - variant.reservedStock;
        variant.status = variant.availableStock > 0 ? "active" : "out-of-stock";
      }
    }

    updateData.updatedBy = updateData.actorId || "system";

    const item = await productRepository.update(id, updateData);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");

    console.log(`[LOG] Product Updated: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async duplicateProduct(id: string, actorId: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const duplicateData = product.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.name = `${product.name} (Copy)`;
    duplicateData.slug = await this.generateUniqueSlug(duplicateData.name);
    duplicateData.status = "draft";

    if (duplicateData.variants && duplicateData.variants.length > 0) {
      for (const variant of duplicateData.variants) {
        variant.sku = `${variant.sku}-COPY`;
        variant.reservedStock = 0;
        variant.availableStock = variant.stock;
      }
    }

    duplicateData.createdBy = actorId;
    duplicateData.updatedBy = actorId;

    return productRepository.create(duplicateData);
  }

  async getProductById(id: string): Promise<IProduct> {
    const item = await productRepository.findById(id);
    if (!item || item.deletedAt) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async getProductBySlug(slug: string): Promise<IProduct> {
    const item = await productRepository.findBySlug(slug);
    if (!item || item.deletedAt) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async listPaginated(options: any) {
    return productRepository.findPaginated(options);
  }

  async archiveProduct(id: string, actorId: string): Promise<IProduct> {
    const item = await productRepository.softDelete(id, actorId);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    console.log(`[LOG] Product Archived: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async restoreProduct(id: string): Promise<IProduct> {
    const item = await productRepository.restore(id);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    console.log(`[LOG] Product Restored: ${item.name} (ID: ${item._id})`);
    return item;
  }

  async publishProduct(id: string, actorId: string): Promise<IProduct> {
    const item = await productRepository.update(id, { status: "published", updatedBy: actorId });
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async unpublishProduct(id: string, actorId: string): Promise<IProduct> {
    const item = await productRepository.update(id, { status: "draft", updatedBy: actorId });
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async updateLabels(id: string, labels: string[], actorId: string): Promise<IProduct> {
    const item = await productRepository.update(id, { labels, updatedBy: actorId });
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async updatePriority(id: string, displayPriority: number, actorId: string): Promise<IProduct> {
    const item = await productRepository.update(id, { displayPriority, updatedBy: actorId });
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async addImage(id: string, image: IImage): Promise<IProduct> {
    const item = await productRepository.addImage(id, image);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async removeImage(productId: string, imageId: string): Promise<IProduct> {
    const item = await productRepository.removeImage(productId, imageId);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
    return item;
  }

  async deleteProduct(id: string): Promise<void> {
    const item = await productRepository.delete(id);
    if (!item) throw new NotFoundError("PRODUCT NOT FOUND");
  }
}

export const productService = new ProductService();
export default productService;
