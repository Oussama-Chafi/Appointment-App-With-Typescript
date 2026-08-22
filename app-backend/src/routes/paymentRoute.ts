import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createCheckoutSession } from "../controllers/paytmentController.js";
const router = Router();

router
  .route("/checkout-session/:appointmentId")
  .post(verifyToken, createCheckoutSession);

export default router;
