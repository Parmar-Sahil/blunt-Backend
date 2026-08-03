import { Router } from "express";
import {
  createReturnRequest,
  getCustomerReturnsList,
  getCustomerReturnDetails,
  getAdminReturnsList,
  updateReturnRequestStatus,
} from "../controllers/return.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireRole } from "../middlewares/authorize.js";

import { upload } from "../middlewares/multer.middleware.js";
import { uploadSingleImage } from "../controllers/upload.controller.js";

const customerRouter = Router();
customerRouter.use(authenticate);
customerRouter.post("/", createReturnRequest);
customerRouter.get("/", getCustomerReturnsList);
customerRouter.get("/:id", getCustomerReturnDetails);
customerRouter.post("/upload", upload.single("image"), uploadSingleImage);

const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireRole("admin"));
adminRouter.get("/", getAdminReturnsList);
adminRouter.patch("/:id", updateReturnRequestStatus);

export { customerRouter as returnRoutes, adminRouter as adminReturnRoutes };
export default customerRouter;
