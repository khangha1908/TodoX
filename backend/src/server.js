import express from "express";
import tasksRouter from "./routes/tasksRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import authRouter from "./routes/authRouter.js";
import templateRouter from "./routes/templateRouter.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();

app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:5173" }));
}

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/templates", templateRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server bắt đầu trên cổng ${PORT}`);
  });
});
