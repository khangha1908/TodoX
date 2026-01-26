import TaskTemplate from "../models/TaskTemplate.js";
import Category from "../models/Category.js";
import { populateCategories } from "../utils/populate.js";

/**
 * GET /api/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const templates = await TaskTemplate.findByUser(req.user.id);
    const populated = await populateCategories(templates, Category);
    res.status(200).json(populated);
  } catch (error) {
    console.error("Lỗi khi getTemplates:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * POST /api/templates
 */
export const createTemplate = async (req, res) => {
  try {
    const { name, title, category, dueDate, priority, description } = req.body;

    const trimmedName = name?.trim();
    const trimmedTitle = title?.trim();

    if (!trimmedName || !trimmedTitle) {
      return res.status(400).json({ message: "Name và title là bắt buộc" });
    }

    // category: "" → null
    let categoryId = null;
    if (category && category !== "") {
      const cat = await Category.findById(category);
      if (!cat || cat.userId !== req.user.id) {
        return res.status(400).json({ message: "Category không hợp lệ" });
      }
      categoryId = category;
    }

    const newTemplate = await TaskTemplate.create({
      name: trimmedName,
      title: trimmedTitle,
      category: categoryId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority: priority || "medium",
      description: description?.trim() || "",
      user: req.user.id,
    });

    const populated = await populateCategories([newTemplate], Category);
    res.status(201).json(populated[0]);
  } catch (error) {
    console.error("Lỗi khi createTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * PUT /api/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const { name, title, category, dueDate, priority, description } = req.body;

    if (category) {
      const cat = await Category.findById(category);
      if (!cat || cat.user !== req.user.id) {
        return res.status(400).json({ message: "Category không hợp lệ" });
      }
    }

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(title !== undefined && { title: title.trim() }),
      ...(category !== undefined && { category: category || null }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
      ...(priority !== undefined && { priority }),
      ...(description !== undefined && { description: description.trim() }),
    };

    const updated = await TaskTemplate.updateById(
      req.params.id,
      req.user.id,
      updateData
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy template" });
    }

    const populated = await populateCategories([updated], Category);
    res.status(200).json(populated[0]);
  } catch (error) {
    console.error("Lỗi khi updateTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

/**
 * DELETE /api/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    console.log("Deleting template:", req.params.id, "for user:", req.user.id);
    const success = await TaskTemplate.deleteById(
      req.params.id,
      req.user.id
    );

    if (!success) {
      console.log("Delete failed: template not found or not owned by user");
      return res.status(404).json({ message: "Không tìm thấy template" });
    }

    console.log("Template deleted successfully");
    res.status(200).json({ message: "Đã xóa template" });
  } catch (error) {
    console.error("Lỗi khi deleteTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
