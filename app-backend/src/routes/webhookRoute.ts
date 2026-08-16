import express from "express";
import { handleStripeWebhook } from "../controllers/webhookController.js";
const router = express();

router
  .route("/webhook")
  .post(express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
