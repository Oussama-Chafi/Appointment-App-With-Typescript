import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import errorHandler from "./middlewares/errorHandler.js";
import notFoundPage from "./middlewares/notFoundPage.js";
import connectToDb from "./db/connectToDb.js";
import mongoose from "mongoose";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import doctorsRoute from "./routes/doctorsRoute.js";
import adminRoute from "./routes/adminRoute.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectToDb();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/root.html"));
});

app.use("/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/doctors", doctorsRoute);

app.use(notFoundPage);

mongoose.connection.once("open", () => {
  console.log("connect to db is success");
  app.listen(PORT, () => {
    console.log("server is running on Port 5000");
  });
});
mongoose.connection.on("error", (err) => {
  console.error(err);
});

app.use(errorHandler);
