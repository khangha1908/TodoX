import Task from "../models/Task.js";
import Category from "../models/Category.js";
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';

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

export const getTasksForCalendar = async (req, res) => {
  const { startDate, endDate, category } = req.query;

  const query = { user: req.user._id };

  if (startDate && endDate) {
    query.dueDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    query.dueDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.dueDate = { $lte: new Date(endDate) };
  }

  if (category) {
    if (category === "none") {
      query.category = null;
    } else {
      query.category = category;
    }
  }

  try {
    const tasks = await Task.find(query).populate('category').sort({ dueDate: 1, createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Lỗi khi getTasksForCalendar:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, category, dueDate, dueTime, priority, description } = req.body;

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
      dueTime,
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
    const { title, status, completedAt, category, dueDate, dueTime, priority, description } = req.body;

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
    if (dueTime !== undefined) updateData.dueTime = dueTime;
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

// Export functions
export const exportTasksToCSV = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate('category').sort({ createdAt: -1 });

    const csvWriter = createObjectCsvWriter({
      path: 'temp.csv',
      header: [
        { id: 'title', title: 'Title' },
        { id: 'status', title: 'Status' },
        { id: 'category', title: 'Category' },
        { id: 'dueDate', title: 'Due Date' },
        { id: 'dueTime', title: 'Due Time' },
        { id: 'priority', title: 'Priority' },
        { id: 'description', title: 'Description' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' },
        { id: 'completedAt', title: 'Completed At' }
      ]
    });

    const records = tasks.map(task => ({
      title: task.title,
      status: task.status,
      category: task.category ? task.category.name : '',
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      dueTime: task.dueTime || '',
      priority: task.priority,
      description: task.description,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : ''
    }));

    await csvWriter.writeRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.download('temp.csv', 'tasks.csv', (err) => {
      if (err) {
        console.error('Error downloading CSV:', err);
      }
      // Clean up temp file
      require('fs').unlinkSync('temp.csv');
    });
  } catch (error) {
    console.error("Lỗi khi exportTasksToCSV:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const exportTasksToJSON = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate('category').sort({ createdAt: -1 });

    const jsonData = tasks.map(task => ({
      title: task.title,
      status: task.status,
      category: task.category ? task.category.name : null,
      dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
      dueTime: task.dueTime || null,
      priority: task.priority,
      description: task.description,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : null
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
    res.send(JSON.stringify(jsonData, null, 2));
  } catch (error) {
    console.error("Lỗi khi exportTasksToJSON:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

export const exportTasksToExcel = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate('category').sort({ createdAt: -1 });

    const data = tasks.map(task => ({
      Title: task.title,
      Status: task.status,
      Category: task.category ? task.category.name : '',
      'Due Date': task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
      'Due Time': task.dueTime || '',
      Priority: task.priority,
      Description: task.description,
      'Created At': task.createdAt.toISOString(),
      'Updated At': task.updatedAt.toISOString(),
      'Completed At': task.completedAt ? task.completedAt.toISOString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error("Lỗi khi exportTasksToExcel:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

// Import function
export const importTasks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const { buffer, mimetype } = req.file;
    let tasksData = [];

    if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
      // Parse CSV
      const stream = Readable.from(buffer.toString());
      const results = [];
      stream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          tasksData = results;
        });
      await new Promise((resolve) => stream.on('end', resolve));
    } else if (mimetype === 'application/json') {
      // Parse JSON
      tasksData = JSON.parse(buffer.toString());
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      tasksData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ message: "Định dạng file không được hỗ trợ" });
    }

    const importedTasks = [];
    const errors = [];

    for (const taskData of tasksData) {
      try {
        let categoryId = null;
        if (taskData.category || taskData.Category) {
          const categoryName = taskData.category || taskData.Category;
          if (categoryName) {
            let category = await Category.findOne({ name: categoryName, user: req.user._id });
            if (!category) {
              category = new Category({ name: categoryName, user: req.user._id });
              await category.save();
            }
            categoryId = category._id;
          }
        }

        const task = new Task({
          title: taskData.title || taskData.Title || '',
          status: taskData.status || taskData.Status || 'active',
          category: categoryId,
          dueDate: taskData.dueDate || taskData['Due Date'] ? new Date(taskData.dueDate || taskData['Due Date']) : null,
          dueTime: taskData.dueTime || taskData['Due Time'] || null,
          priority: taskData.priority || taskData.Priority || 'medium',
          description: taskData.description || taskData.Description || '',
          user: req.user._id
        });

        const savedTask = await task.save();
        const populatedTask = await Task.findById(savedTask._id).populate('category');
        importedTasks.push(populatedTask);
      } catch (error) {
        errors.push({ data: taskData, error: error.message });
      }
    }

    res.status(201).json({
      message: `Đã nhập ${importedTasks.length} nhiệm vụ thành công`,
      importedTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Lỗi khi importTasks:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};
