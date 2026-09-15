import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createReview } from "../controllers/reviewController.js";
const router = express.Router();

router
  .route("/doctor/:doctorID/appointment/:appointmentID")
  .post(verifyToken, createReview);

export default router;
