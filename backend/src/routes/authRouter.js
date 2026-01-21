import express from "express";
import multer from "multer";
import { register, login, getProfile, uploadAvatar } from "../controllers/authControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for avatar. Only JPEG, PNG, GIF, WebP allowed.'));
    }
  }
});

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);
router.post("/avatar", protect, avatarUpload.single('avatar'), uploadAvatar);

export default router;
