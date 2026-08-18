import productRepository from "../repositories/product.repository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class InventoryService {
  async reserveStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) throw new NotFoundError(`VARIANT '${variantId}' NOT FOUND`);

    // if (variant.availableStock < quantity) {
    //   throw new BadRequestError(`INSUFFICIENT INVENTORY FOR SKU '${variantId}'`);
    // }

    variant.reservedStock += quantity;
    variant.availableStock = variant.stock - variant.reservedStock;

    await product.save();
    console.log(`[LOG] Stock Reserved: SKU ${variantId} | Quantity: ${quantity}`);
  }

  async releaseReservedStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) throw new NotFoundError(`VARIANT '${variantId}' NOT FOUND`);

    variant.reservedStock = Math.max(0, variant.reservedStock - quantity);
    variant.availableStock = variant.stock - variant.reservedStock;

    await product.save();
    console.log(`[LOG] Stock Reservation Released: SKU ${variantId} | Quantity: ${quantity}`);
  }

  async deductStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) throw new NotFoundError(`VARIANT '${variantId}' NOT FOUND`);

    // if (variant.stock < quantity) {
    //   throw new BadRequestError(`INSUFFICIENT STOCK FOR SKU '${variantId}'`);
    // }

    variant.stock -= quantity;
    variant.availableStock = variant.stock - variant.reservedStock;
    variant.status = variant.availableStock > 0 ? "active" : "out-of-stock";

    await product.save();
    console.log(`[LOG] Inventory Deducted: SKU ${variantId} | Quantity: ${quantity}`);
  }

  async confirmOrderStockReduction(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) throw new NotFoundError(`VARIANT '${variantId}' NOT FOUND`);

    // if (variant.stock < quantity) {
    //   throw new BadRequestError(`INSUFFICIENT STOCK FOR SKU '${variantId}'`);
    // }

    // Deduct stock, and release the reservation (as it is now a completed purchase)
    variant.stock -= quantity;
    variant.reservedStock = Math.max(0, variant.reservedStock - quantity);
    variant.availableStock = variant.stock - variant.reservedStock;
    variant.status = variant.availableStock > 0 ? "active" : "out-of-stock";

    await product.save();
    console.log(`[LOG] Inventory Confirmed & Deducted: SKU ${variantId} | Quantity: ${quantity}`);
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
