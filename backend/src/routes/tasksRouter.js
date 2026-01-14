import express from 'express';
import multer from 'multer';
import { getAllTasks, getTasksForCalendar, createTask,updateTask, deleteTask, bulkDeleteTasks, bulkUpdateTasks, exportTasksToCSV, exportTasksToJSON, exportTasksToExcel, importTasks } from '../controllers/tasksControllers.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and Excel files are allowed.'));
    }
  }
});

router.get("/", protect, getAllTasks);
router.get("/calendar", protect, getTasksForCalendar);

router.post("/", protect, createTask);

router.put("/:id", protect, updateTask);


router.delete("/:id", protect, deleteTask);
router.post("/bulk-delete", protect, bulkDeleteTasks);
router.post("/bulk-update", protect, bulkUpdateTasks);

// Export routes
router.get("/export/csv", protect, exportTasksToCSV);
router.get("/export/json", protect, exportTasksToJSON);
router.get("/export/excel", protect, exportTasksToExcel);

// Import route
router.post("/import", protect, upload.single('file'), importTasks);

export default router;
