import TaskTemplate from "../models/TaskTemplate.js";
import Category from "../models/Category.js";

export const getTemplates = async (req, res) => {
  try {
    const templates = await TaskTemplate.find({ user: req.user._id }).populate('category').sort({ createdAt: -1 });
    res.status(200).json(templates);
  } catch (error) {
    console.error("Lỗi khi getTemplates:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { name, title, category, dueDate, priority, description } = req.body;

    // Handle category: convert empty string to null
    const categoryId = category && category !== "" ? category : null;

    // Validate category if provided
    if (categoryId) {
      const categoryExists = await Category.findOne({ _id: categoryId, user: req.user._id });
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
    }

    const template = new TaskTemplate({
      name,
      title,
      category: categoryId,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      description: description?.trim() || "",
      user: req.user._id
    });
    const newTemplate = await template.save();
    const populatedTemplate = await TaskTemplate.findById(newTemplate._id).populate('category');
    res.status(201).json(populatedTemplate);
  } catch (error) {
    console.error("Lỗi khi createTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, title, status, category, dueDate, priority, description } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findOne({ _id: category, user: req.user._id });
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority || "medium";
    if (description !== undefined) updateData.description = description?.trim() || "";

    const updatedTemplate = await TaskTemplate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).populate('category');

    if (!updatedTemplate) {
      return res.status(404).json({ message: "Không tìm thấy template" });
    }
    res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("Lỗi khi updateTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const deletedTemplate = await TaskTemplate.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedTemplate) {
      return res.status(404).json({ message: "Không tìm thấy template" });
    }

    res.status(200).json(deletedTemplate);
  } catch (error) {
    console.error("Lỗi khi deleteTemplate:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};
