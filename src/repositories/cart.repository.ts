import Cart, { ICart } from "../models/cart.model.js";

export class CartRepository {
  async findByUserId(userId: string): Promise<ICart | null> {
    return Cart.findOne({ userId }).populate("items.productId");
  }

  async findById(id: string): Promise<ICart | null> {
    return Cart.findById(id).populate("items.productId");
  }

  async findByGuestId(guestId: string): Promise<ICart | null> {
    return Cart.findOne({ guestId }).populate("items.productId");
  }

  async findByUserOrGuest(userId?: string, guestId?: string): Promise<ICart | null> {
    if (userId) {
      return this.findByUserId(userId);
    }
    if (guestId) {
      return this.findByGuestId(guestId);
    }
    return null;
  }

  async create(data: Partial<ICart>): Promise<ICart> {
    const item = new Cart(data);
    await item.save();
    return item.populate("items.productId");
  }

  async update(id: string, updateData: Partial<ICart>): Promise<ICart | null> {
    return Cart.findByIdAndUpdate(id, updateData, { new: true }).populate("items.productId");
  }

  async delete(id: string): Promise<ICart | null> {
    return Cart.findByIdAndDelete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await Cart.deleteOne({ userId });
  }

  async deleteByGuestId(guestId: string): Promise<void> {
    await Cart.deleteOne({ guestId });
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
