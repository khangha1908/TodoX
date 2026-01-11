import express from "express";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/templateControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/templates - Get all templates for the authenticated user
router.get("/", getTemplates);

// POST /api/templates - Create a new template
router.post("/", createTemplate);

// PUT /api/templates/:id - Update a template
router.put("/:id", updateTemplate);

// DELETE /api/templates/:id - Delete a template
router.delete("/:id", deleteTemplate);

export default router;
