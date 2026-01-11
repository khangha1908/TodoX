import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#6366f1", // Default indigo color
    },
    description: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound unique index on name and user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
