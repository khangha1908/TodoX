import Task from "../models/Task.js";
import Category from "../models/Category.js";

export const getAllTasks = async (req, res) => {
  const { filter = "all", category } = req.query;
  const now = new Date();

  let startDate;

  switch (filter) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      const mondayDate =
        now.getDate() - (now.getDay() - 1) - (now.getDay() === 0 ? 7 : 0);
      startDate = new Date(now.getFullYear(), now.getMonth(), mondayDate);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "all":
    default: {
      startDate = null;
    }
  }

  const query = { user: req.user._id };
  if (startDate) {
    query.createdAt = { $gte: startDate };
  }
  if (category) {
    if (category === "none") {
      query.category = null;
    } else {
      query.category = category;
    }
  }

  try {
    const tasks = await Task.find(query).populate('category').sort({ createdAt: -1 });
    const activeCount = await Task.countDocuments({ ...query, status: "active" });
    const completeCount = await Task.countDocuments({ ...query, status: "complete" });
    res.status(200).json({ tasks, activeCount, completeCount });
  } catch (error) {
    console.error("Lỗi khi getAllTasks:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, category, dueDate, priority, description } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findOne({ _id: category, user: req.user._id });
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
    }

    const task = new Task({
      title,
      category,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      description: description?.trim() || "",
      user: req.user._id
    });
    const newTask = await task.save();
    const populatedTask = await Task.findById(newTask._id).populate('category');
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Lỗi khi createTask:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, status, completedAt, category, dueDate, priority, description } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findOne({ _id: category, user: req.user._id });
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    if (category !== undefined) updateData.category = category || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority || "medium";
    if (description !== undefined) updateData.description = description?.trim() || "";

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).populate('category');

    if (!updatedTask) {
      return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Lỗi khi updateTask:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedTask) {
      return res.status(404).json({ message: "Không tìm thấy nhiệm vụ" });
    }

    res.status(200).json(deletedTask);
  } catch (error) {
    console.error("Lỗi khi deleteTask:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const bulkDeleteTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Danh sách taskIds không hợp lệ" });
    }

    const result = await Task.deleteMany({ _id: { $in: taskIds }, user: req.user._id });
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Lỗi khi bulkDeleteTasks:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, status, completedAt } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Danh sách taskIds không hợp lệ" });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt;

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, user: req.user._id },
      updateData
    );
    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Lỗi khi bulkUpdateTasks:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};
