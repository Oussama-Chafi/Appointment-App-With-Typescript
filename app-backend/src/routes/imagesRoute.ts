import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { uploadAvatar } from "../controllers/uploadImageController.js";
import { uploader } from "../middlewares/uploadImages.js";

const router = Router();

router
  .route("/upload-avatar")
  .put(verifyToken, uploader.single("avatar"), uploadAvatar);

export default router;
