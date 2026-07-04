import { Router } from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import validateRequest from "../middlewares/validation.js";
import { addressValidationSchema } from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

router.get("/", getAddresses);
router.post("/", validateRequest(addressValidationSchema), createAddress);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
