import { Router } from "express";
import {
  getNextDropNumber,
  getLatestDrop,
  getAllDrops,
  getDropById,
  createDrop,
  updateDrop,
  activateDrop,
  archiveDrop,
  deleteDrop,
} from "../controllers/drop.controller.js";
import { jwtService } from "../services/jwt.service.js";

const router = Router();

// Middleware to extract admin info if available
const adminAuthHandler = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwtService.verifyAccessToken(token);
      req.admin = {
        id: decoded.userId || "admin",
        role: "admin",
        name: "Admin",
        email: "admin@blunt.luxury",
        permissions: [],
      };
      (req as any).user = { userId: decoded.userId || "admin" };
    } catch {
      (req as any).user = { userId: "admin" };
    }
  } else {
    (req as any).user = { userId: "admin" };
  }
  next();
};

// Public storefront endpoints
router.get("/latest", getLatestDrop);
router.get("/next-number", getNextDropNumber);
router.get("/", getAllDrops);
router.get("/:id", getDropById);

// Admin management endpoints
router.post("/", adminAuthHandler, createDrop);
router.patch("/:id/activate", adminAuthHandler, activateDrop);
router.patch("/:id/archive", adminAuthHandler, archiveDrop);
router.patch("/:id", adminAuthHandler, updateDrop);
router.delete("/:id", adminAuthHandler, deleteDrop);

export default router;
