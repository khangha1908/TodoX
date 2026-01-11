import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryControllers.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get("/", protect, getAllCategories);
router.post("/", protect, createCategory);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
