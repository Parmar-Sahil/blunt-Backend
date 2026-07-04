import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCarts,
} from "../controllers/cart.controller.js";
import { authenticate, optionalAuthenticate } from "../middlewares/authenticate.js";
import validateRequest from "../middlewares/validation.js";
import { addToCartSchema, updateCartItemSchema, mergeCartSchema } from "../validators/cart.schema.js";

const router = Router();

// Retrieve cart (Authenticated user or Guest user)
router.get("/", optionalAuthenticate, getCart);

// Add item to cart (Authenticated user or Guest user)
router.post("/items", optionalAuthenticate, validateRequest(addToCartSchema), addToCart);

// Update cart item quantity (Authenticated user or Guest user)
router.patch("/items/:id", optionalAuthenticate, validateRequest(updateCartItemSchema), updateCartItem);

// Remove item from cart (Authenticated user or Guest user)
router.delete("/items/:id", optionalAuthenticate, removeFromCart);

// Clear cart (Authenticated user or Guest user)
router.delete("/", optionalAuthenticate, clearCart);

// Merge Guest cart into Authenticated User cart
router.post("/merge", authenticate, validateRequest(mergeCartSchema), mergeCarts);

export default router;
