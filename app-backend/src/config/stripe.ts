import Stripe from "stripe";
import { AppError } from "../utils/AppError.js";
export const getStripeInstance = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new AppError(
      400,
      "Add the secret key of the stripe in the env file.",
    );
  }
  return new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });
};
