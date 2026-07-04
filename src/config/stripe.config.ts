import dotenv from "dotenv";
dotenv.config();

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export default stripeConfig;
