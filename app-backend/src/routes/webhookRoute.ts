import express from "express";
import { handleStripeWebhook } from "../controllers/webhookController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
const router = express();

router
  .route("/webhook")
  .post(
    express.raw({ type: "application/json" }),
    verifyToken,
    handleStripeWebhook,
  );

export default router;
