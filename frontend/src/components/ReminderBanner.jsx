import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { showTaskNotification } from "@/lib/notifications";

const ReminderBanner = ({ tasks }) => {
  const [dismissed, setDismissed] = useState(false);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  useEffect(() => {
    // Filter tasks that are due within 24 hours and are active
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const urgent = tasks.filter(task => {
      if (task.status !== 'active' || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= tomorrow;
    });

    setUrgentTasks(urgent);
    // Reset dismissed state when new urgent tasks appear
    if (urgent.length > 0) {
      setDismissed(false);
    }
  }, [tasks]);

  useEffect(() => {
    // Show notifications for new urgent tasks
    urgentTasks.forEach(task => {
      if (!notifiedTasks.has(task._id)) {
        showTaskNotification(task);
        setNotifiedTasks(prev => new Set([...prev, task._id]));
      }
    });
  }, [urgentTasks, notifiedTasks]);

  if (dismissed || urgentTasks.length === 0) {
    return null;
  }

  const formatTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} giờ ${diffMinutes} phút`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} phút`;
    } else {
      return "Đã đến hạn";
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800/50 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">
              Nhắc nhở: {urgentTasks.length} nhiệm vụ sắp đến hạn!
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {urgentTasks.slice(0, 3).map((task) => (
              <div key={task._id} className="flex items-center gap-2 p-2 bg-white/50 dark:bg-black/20 rounded-md">
                <Clock className="size-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100 truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Còn {formatTimeRemaining(task.dueDate)}
                  </p>
                </div>
                {task.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    Cao
                  </Badge>
                )}
              </div>
            ))}
            {urgentTasks.length > 3 && (
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Và {urgentTasks.length - 3} nhiệm vụ khác...
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReminderBanner;
