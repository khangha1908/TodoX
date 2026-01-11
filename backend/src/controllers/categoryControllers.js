import Category from "../models/Category.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Lỗi khi getAllCategories:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const category = new Category({
      name: name.trim(),
      color: color || "#6366f1",
      description: description?.trim(),
      user: req.user._id
    });

    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Lỗi khi createCategory:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Tên category đã tồn tại" });
    }
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const categoryId = req.params.id;

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: categoryId, user: req.user._id },
      {
        name: name.trim(),
        color: color || "#6366f1",
        description: description?.trim()
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Lỗi khi updateCategory:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Tên category đã tồn tại" });
    }
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category is being used by any tasks
    const Task = (await import("../models/Task.js")).default;
    const tasksUsingCategory = await Task.find({ category: categoryId, user: req.user._id });

    if (tasksUsingCategory.length > 0) {
      return res.status(400).json({
        message: "Không thể xóa category đang được sử dụng bởi các task"
      });
    }

    const deletedCategory = await Category.findOneAndDelete({ _id: categoryId, user: req.user._id });
    if (!deletedCategory) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    res.status(200).json(deletedCategory);
  } catch (error) {
    console.error("Lỗi khi deleteCategory:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};
