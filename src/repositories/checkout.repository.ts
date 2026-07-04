import Checkout, { ICheckout } from "../models/checkout.model.js";

export class CheckoutRepository {
  async findByCheckoutId(checkoutId: string): Promise<ICheckout | null> {
    return Checkout.findOne({ checkoutId }).populate("items.productId");
  }

  async findActiveByCartId(cartId: string): Promise<ICheckout | null> {
    return Checkout.findOne({ cartId, status: "pending", expiresAt: { $gt: new Date() } });
  }

  async create(data: Partial<ICheckout>): Promise<ICheckout> {
    const item = new Checkout(data);
    await item.save();
    return item.populate("items.productId");
  }

  async updateStatus(checkoutId: string, status: "pending" | "expired" | "completed" | "cancelled"): Promise<ICheckout | null> {
    return Checkout.findOneAndUpdate({ checkoutId }, { status }, { new: true }).populate("items.productId");
  }

  async delete(checkoutId: string): Promise<ICheckout | null> {
    return Checkout.findOneAndDelete({ checkoutId });
  }
}

export const checkoutRepository = new CheckoutRepository();
export default checkoutRepository;
