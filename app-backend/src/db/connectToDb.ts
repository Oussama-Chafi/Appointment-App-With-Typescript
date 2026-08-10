import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

const connectToDb = async () => {
  if (!process.env.DB_URL) {
    throw new AppError(
      401,
      "you should add your db link in the .env file first!",
    );
  }

  await mongoose.connect(process.env.DB_URL , {dbName : "appointment"});
};

export default connectToDb;
