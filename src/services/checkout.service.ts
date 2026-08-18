import crypto from "crypto";
import cartRepository from "../repositories/cart.repository.js";
import productRepository from "../repositories/product.repository.js";
import checkoutRepository from "../repositories/checkout.repository.js";
import pricingService from "./pricing.service.js";
import shippingService from "./shipping.service.js";
import taxService from "./tax.service.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.js";
import { ICheckout } from "../models/checkout.model.js";

export class CheckoutService {
  async createCheckoutSession(options: {
    userId: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    shippingMethod: "Standard" | "Express" | "International";
  }): Promise<ICheckout> {
    const { userId, shippingAddress, billingAddress, shippingMethod } = options;

    // 1. Retrieve user cart
    const cart = await cartRepository.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("CANNOT START CHECKOUT WITH AN EMPTY CART");
    }

    // 2. Prevent duplicate active checkout sessions for the same cart
    const activeSession = await checkoutRepository.findActiveByCartId(String(cart._id));
    if (activeSession) {
      // Terminate/delete the prior duplicate active session to start fresh
      await checkoutRepository.delete(activeSession.checkoutId);
    }

    const validatedItems: any[] = [];
    let calculatedSubtotal = 0;

    // 3. Validate products, variants, inventory, and prices
    for (const cartItem of cart.items) {
      let pId = String(cartItem.productId);
      if (!pId || pId === "undefined" || pId.includes("{")) {
        const match = pId.match(/([0-9a-fA-F]{24})/);
        if (match) pId = match[1];
      }

      const product = await productRepository.findById(pId);
      if (!product || product.deletedAt || product.status !== "published") {
        throw new NotFoundError(`PRODUCT '${cartItem.variantId}' IS NO LONGER AVAILABLE.`);
      }

      const variant = product.variants.find((v: any) => v.sku === cartItem.variantId || String(v._id) === cartItem.variantId);
      if (!variant || variant.status !== "active") {
        throw new NotFoundError(`PRODUCT VARIANT '${cartItem.variantId}' IS NOT ACTIVE.`);
      }

      // Allow checkout to proceed even if stock is insufficient; system warnings will be recorded for admin.
      // if (variant.availableStock < cartItem.quantity) {
      //   throw new BadRequestError(
      //     `INSUFFICIENT STOCK FOR '${product.name} - ${variant.size}/${variant.color}'. AVAILABLE: ${variant.availableStock}.`
      //   );
      // }

      const catalogPrice = variant.priceOverride !== null && variant.priceOverride !== undefined
        ? variant.priceOverride
        : product.price;

      if (catalogPrice !== cartItem.unitPrice) {
        throw new BadRequestError(
          `PRICE HAS CHANGED FOR '${product.name}'. CART PRICE: ${cartItem.unitPrice}, CATALOG PRICE: ${catalogPrice}.`
        );
      }

      const itemSubtotal = catalogPrice * cartItem.quantity;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: product._id,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        unitPrice: catalogPrice,
        subtotal: itemSubtotal,
      });
    }

    // 4. Calculate pricing, shipping, and taxes
    const discount = 0; // TODO: Coupons / Reward Points deduction logic
    const shipping = shippingService.calculateShipping(
      calculatedSubtotal,
      shippingMethod,
      shippingAddress.country
    );
    const tax = taxService.calculateTax(
      calculatedSubtotal,
      shippingAddress.country,
      shippingAddress.state
    );
    const grandTotal = parseFloat((calculatedSubtotal - discount + shipping + tax).toFixed(2));

    // 5. Select payment gateway based on shipping destination
    const shippingCountryLower = shippingAddress.country.toLowerCase().trim();
    const paymentGateway =
      shippingCountryLower === "in" || shippingCountryLower === "india" ? "razorpay" : "stripe";

    // 6. Generate checkout session metadata
    const checkoutId = "chk_" + crypto.randomBytes(12).toString("hex");
    const expirationMs = parseInt(process.env.CHECKOUT_SESSION_EXPIRATION_MS || "900000"); // default 15 minutes
    const expiresAt = new Date(Date.now() + expirationMs);

    // TODO: Abandoned Checkout Recovery - Track active session creations in segment analysis
    // TODO: International Taxes - Apply regional VAT policies
    // TODO: Store Credits - Deduct available customer balance

    // 7. Store temporary checkout session
    const session = await checkoutRepository.create({
      checkoutId,
      userId,
      cartId: cart._id,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentGateway,
      status: "pending",
      expiresAt,
    });

    console.log(`[LOG] Checkout Session Created: ${session.checkoutId} for user ${userId}`);
    return session;
  }

  async getCheckoutSession(checkoutId: string, userId: string): Promise<ICheckout> {
    const session = await checkoutRepository.findByCheckoutId(checkoutId);
    if (!session || String(session.userId) !== userId) {
      throw new NotFoundError("CHECKOUT SESSION NOT FOUND");
    }

    if (session.status === "pending" && session.expiresAt < new Date()) {
      session.status = "expired";
      await session.save();
      throw new BadRequestError("CHECKOUT SESSION EXPIRED");
    }

    return session;
  }

  async cancelCheckoutSession(checkoutId: string, userId: string): Promise<ICheckout> {
    const session = await checkoutRepository.findByCheckoutId(checkoutId);
    if (!session || String(session.userId) !== userId) {
      throw new NotFoundError("CHECKOUT SESSION NOT FOUND");
    }

    if (session.status !== "pending") {
      throw new BadRequestError(`CANNOT CANCEL CHECKOUT IN '${session.status.toUpperCase()}' STATE`);
    }

    session.status = "cancelled";
    await session.save();

    console.log(`[LOG] Checkout Session Cancelled: ${session.checkoutId}`);
    return session;
  }
}

export const checkoutService = new CheckoutService();
export default checkoutService;
