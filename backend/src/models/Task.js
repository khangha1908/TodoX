import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "complete"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // ✅ THÊM FIELD NÀY
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false, // hoặc true nếu bắt buộc phải có category
    },
    dueDate: {
      type: Date,
      required: false,
    },
    dueTime: {
      type: String, // Format: "HH:MM"
      required: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;