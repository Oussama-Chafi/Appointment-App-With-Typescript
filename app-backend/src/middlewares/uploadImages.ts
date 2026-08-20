import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import streamifier from "streamifier";
import { AppError } from "../utils/AppError.js";

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Only image files are allowed!"));
  }
};

export const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export const uploadToCloudinary = (
  image: Express.Multer.File,
  folderName: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Upload failed"));
        resolve(result);
      },
    );
    streamifier.createReadStream(image.buffer).pipe(stream);
  });
};

export const removeOldImage = async (publicId: string) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};
