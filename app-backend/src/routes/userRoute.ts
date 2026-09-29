import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  changePassword,
  deleteAccount,
  getProfile,
  logoutAllDevices,
  updateProfile,
} from "../controllers/userController.js";
import { validateBody } from "../middlewares/validationData.js";
import {
  changePasswordVali,
  updateUserVali,
} from "../validation/userValidation.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.route("/").get(verifyToken, getProfile);
router
  .route("/change-password")
  .patch(
    validateBody(changePasswordVali),
    verifyToken,
    authLimiter,
    changePassword,
  );
router
  .route("/update-profile")
  .patch(validateBody(updateUserVali), verifyToken, updateProfile);

router.route("/delete-account").delete(verifyToken, authLimiter, deleteAccount);
router.route("/logout-all").patch(verifyToken, authLimiter, logoutAllDevices);

export default router;
