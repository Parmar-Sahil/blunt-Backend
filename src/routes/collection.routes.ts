import { Router } from "express";
import { getCollections, getCollectionById, getCollectionBySlug } from "../controllers/collection.controller.js";

const router = Router();

router.get("/", getCollections);
router.get("/:id", getCollectionById);
router.get("/slug/:slug", getCollectionBySlug);

export default router;
