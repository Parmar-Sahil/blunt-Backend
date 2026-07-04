import wishlistRepository from "../repositories/wishlist.repository.js";
import { IWishlist } from "../models/wishlist.model.js";
import { NotFoundError } from "../utils/errors.js";
import mongoose from "mongoose";

export class WishlistService {
  async getWishlistByUserId(userId: string): Promise<IWishlist> {
    let wishlist = await wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      wishlist = await wishlistRepository.create({ user: userId as any, products: [] });
    }
    return wishlist;
  }

  async addProductToWishlist(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await this.getWishlistByUserId(userId);
    const prodId = new mongoose.Types.ObjectId(productId);
    if (!wishlist.products.some((p) => p.equals(prodId))) {
      wishlist.products.push(prodId);
      const updated = await wishlistRepository.update(wishlist.id, { products: wishlist.products });
      if (!updated) throw new NotFoundError("WISHLIST UPDATE FAILURE");
      return updated;
    }
    return wishlist;
  }

  async removeProductFromWishlist(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await this.getWishlistByUserId(userId);
    const prodId = new mongoose.Types.ObjectId(productId);
    wishlist.products = wishlist.products.filter((p) => !p.equals(prodId));
    const updated = await wishlistRepository.update(wishlist.id, { products: wishlist.products });
    if (!updated) throw new NotFoundError("WISHLIST UPDATE FAILURE");
    return updated;
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
