import Category from "../models/Category.js";

/**
 * GET /api/categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findByUser(req.user.id);
    res.status(200).json(categories);
  } catch (err) {
    console.error("getAllCategories error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/categories
 */
export const createCategory = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên category là bắt buộc" });
    }

    const category = await Category.create({
      name,
      color,
      description,
      user: req.user.id,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("createCategory error:", err);

    if (err.message.includes("already exists")) {
      return res.status(400).json({ message: "Category đã tồn tại" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/categories/:id
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Category.updateById(id, req.body, req.user.id);
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    res.json(updated);
  } catch (err) {
    console.error("updateCategory error:", err);

    if (err.message.includes("already exists")) {
      return res.status(400).json({ message: "Category đã tồn tại" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.deleteById(id, req.user.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
