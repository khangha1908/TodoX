import express from 'express';
import { getAllTasks,createTask,updateTask, deleteTask, bulkDeleteTasks, bulkUpdateTasks } from '../controllers/tasksControllers.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.get("/", protect, getAllTasks);

router.post("/", protect, createTask);

router.put("/:id", protect, updateTask);


router.delete("/:id", protect, deleteTask);
router.post("/bulk-delete", protect, bulkDeleteTasks);
router.post("/bulk-update", protect, bulkUpdateTasks);
export default router;
