'use strict';

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const AppError = require('../utils/AppError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `shringar-jewelry/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
      ],
      public_id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }),
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',');
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG and WebP images are allowed.', 400), false);
  }
};

const uploadProduct = multer({
  storage: createStorage('products'),
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, files: 8 },
});

const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

const uploadCategoryImage = multer({
  storage: createStorage('categories'),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
});

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    throw new Error(`Cloudinary delete failed: ${err.message}`);
  }
};

const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (err) {
    throw new Error(`Cloudinary bulk delete failed: ${err.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadProduct,
  uploadAvatar,
  uploadCategoryImage,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
};
