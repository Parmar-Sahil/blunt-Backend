import cartRepository from "../repositories/cart.repository.js";
import productRepository from "../repositories/product.repository.js";
import { ICart, ICartItem } from "../models/cart.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

export class CartService {
  async getOrCreateCart(options: { userId?: string; guestId?: string }): Promise<ICart> {
    const { userId, guestId } = options;
    if (!userId && !guestId) {
      throw new BadRequestError("USER ID OR GUEST ID IS REQUIRED TO RESOLVE CART");
    }

    let cart = await cartRepository.findByUserOrGuest(userId, guestId);
    if (!cart) {
      const expiresAt = guestId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
      cart = await cartRepository.create({
        userId: userId || null,
        guestId: guestId || null,
        items: [],
        expiresAt,
      });
    }
    return cart;
  }

  async recalculateCart(cart: ICart): Promise<ICart> {
    let subtotal = 0;
    const validItems: any[] = [];

    for (const item of cart.items) {
      let pId = String(item.productId);
      if (!pId || pId === "undefined" || pId.includes("{")) {
        const match = pId.match(/([0-9a-fA-F]{24})/);
        if (match) {
          pId = match[1];
          item.productId = pId;
        } else {
          // Skip/purge corrupt item
          continue;
        }
      }

      const product = await productRepository.findById(pId);
      if (product) {
        const variant = product.variants.find((v: any) => v.sku === item.variantId);
        const price = variant?.priceOverride || product.price;
        item.unitPrice = price;
        item.subtotal = price * item.quantity;
        subtotal += item.subtotal;
        validItems.push(item);
      }
    }

    cart.items = validItems;

    cart.subtotal = subtotal;
    cart.tax = parseFloat((subtotal * 0.08).toFixed(2)); // 8% sales tax
    cart.shipping = subtotal > 150 || subtotal === 0 ? 0 : 15; // Free shipping over $150
    cart.total = parseFloat((subtotal - cart.discount + cart.shipping + cart.tax).toFixed(2));

    const updated = await cartRepository.update(String(cart._id), {
      items: cart.items,
      subtotal: cart.subtotal,
      discount: cart.discount,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
    });

    if (!updated) throw new NotFoundError("CART CALCULATION FAILURE");
    return updated;
  }

  async addItem(options: {
    userId?: string;
    guestId?: string;
    productId: string;
    variantId: string;
    quantity: number;
  }): Promise<ICart> {
    const { userId, guestId, productId, variantId, quantity } = options;

    const product = await productRepository.findById(productId);
    if (!product || product.deletedAt || product.status !== "published") {
      throw new NotFoundError("PRODUCT NOT FOUND OR UNPUBLISHED");
    }

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) {
      throw new NotFoundError(`PRODUCT VARIANT '${variantId}' NOT FOUND`);
    }

    const cart = await this.getOrCreateCart({ userId, guestId });
    const existingItem = cart.items.find((i) => i.variantId === variantId);
    const targetQuantity = (existingItem?.quantity || 0) + quantity;

    if (variant.availableStock < targetQuantity) {
      throw new BadRequestError(`INSUFFICIENT STOCK. ONLY ${variant.availableStock} UNITS AVAILABLE.`);
    }

    if (existingItem) {
      existingItem.quantity = targetQuantity;
    } else {
      cart.items.push({
        productId,
        variantId,
        quantity,
        unitPrice: variant.priceOverride || product.price,
        subtotal: (variant.priceOverride || product.price) * quantity,
      });
    }

    // TODO: Wishlist Integration - Auto-clear from user wishlist on cart additions
    // TODO: Cross Sell - Auto push items of categoryIds matches

    return this.recalculateCart(cart);
  }

  async updateQuantity(options: {
    userId?: string;
    guestId?: string;
    variantId: string;
    quantity: number;
  }): Promise<ICart> {
    const { userId, guestId, variantId, quantity } = options;
    const cart = await this.getOrCreateCart({ userId, guestId });

    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) throw new NotFoundError("ITEM NOT FOUND IN CART");

    const product = await productRepository.findById(String(item.productId));
    if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

    const variant = product.variants.find((v: any) => v.sku === variantId);
    if (!variant) throw new NotFoundError("PRODUCT VARIANT NOT FOUND");

    if (variant.availableStock < quantity) {
      throw new BadRequestError(`INSUFFICIENT STOCK. ONLY ${variant.availableStock} UNITS AVAILABLE.`);
    }

    item.quantity = quantity;
    return this.recalculateCart(cart);
  }

  async removeItem(options: { userId?: string; guestId?: string; variantId: string }): Promise<ICart> {
    const { userId, guestId, variantId } = options;
    const cart = await this.getOrCreateCart({ userId, guestId });

    cart.items = cart.items.filter((i) => i.variantId !== variantId);
    return this.recalculateCart(cart);
  }

  async clearCart(options: { userId?: string; guestId?: string }): Promise<ICart> {
    const { userId, guestId } = options;
    const cart = await this.getOrCreateCart({ userId, guestId });
    cart.items = [];
    return this.recalculateCart(cart);
  }

  async mergeCarts(userId: string, guestId: string): Promise<ICart> {
    const guestCart = await cartRepository.findByGuestId(guestId);
    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart({ userId });
    }

    const userCart = await this.getOrCreateCart({ userId });

    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find((i) => i.variantId === guestItem.variantId);
      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + guestItem.quantity, 50);
      } else {
        userCart.items.push(guestItem);
      }
    }

    await cartRepository.deleteByGuestId(guestId);

    // TODO: Coupons - Fetch coupon codes
    // TODO: Gift Cards - Deduct matching voucher items balances
    // TODO: Upsell - Highlight premium capsule statements
    // TODO: Recommendation Engine - Cross-linking drops lists

    return this.recalculateCart(userCart);
  }

  async validateCartInventory(cartId: string): Promise<{ isValid: boolean; messages: string[] }> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) throw new NotFoundError("CART NOT FOUND");

    const messages: string[] = [];
    let isValid = true;

    for (const item of cart.items) {
      const product = await productRepository.findById(String(item.productId));
      if (!product || product.deletedAt || product.status !== "published") {
        isValid = false;
        messages.push(`PRODUCT '${item.variantId}' IS NO LONGER AVAILABLE.`);
        continue;
      }

      const variant = product.variants.find((v: any) => v.sku === item.variantId);
      if (!variant) {
        isValid = false;
        messages.push(`VARIANT '${item.variantId}' IS NO LONGER AVAILABLE.`);
        continue;
      }

      if (variant.availableStock < item.quantity) {
        isValid = false;
        messages.push(`INSUFFICIENT STOCK FOR SKU '${item.variantId}'. AVAILABLE: ${variant.availableStock}.`);
      }
    }

    return { isValid, messages };
  }
}

export const cartService = new CartService();
export default cartService;
