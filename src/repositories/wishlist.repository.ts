import Wishlist, { IWishlist } from "../models/wishlist.model.js";

export class WishlistRepository {
  async findByUserId(userId: string): Promise<IWishlist | null> {
    return Wishlist.findOne({ user: userId }).populate("products");
  }

  async findById(id: string): Promise<IWishlist | null> {
    return Wishlist.findById(id).populate("products");
  }

  async create(data: Partial<IWishlist>): Promise<IWishlist> {
    const item = new Wishlist(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<IWishlist>): Promise<IWishlist | null> {
    return Wishlist.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IWishlist | null> {
    return Wishlist.findByIdAndDelete(id);
  }
}

export const wishlistRepository = new WishlistRepository();
export default wishlistRepository;
