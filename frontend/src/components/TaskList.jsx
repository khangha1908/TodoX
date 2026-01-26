import React from "react";
import TaskEmptyState from "./TaskEmptyState";
import TaskCard from "./TaskCard";

const TaskList = ({
  filteredTasks,
  filter,
  handleTaskChanged,
  selectedTasks,
  setSelectedTasks
}) => {

  const handleSelectTask = (taskId, isSelected) => {
    if (!taskId) return;

    if (isSelected) {
      setSelectedTasks(prev =>
        prev.includes(taskId) ? prev : [...prev, taskId]
      );
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  if (!Array.isArray(filteredTasks) || filteredTasks.length === 0) {
    return <TaskEmptyState filter={filter} />;
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task, index) => {
        const taskId = task.id;

        if (!taskId) {
          console.warn("❌ Task thiếu id:", task);
          return null;
        }

        return (
          <TaskCard
            key={taskId}
            task={task}
            index={index}
            handleTaskChanged={handleTaskChanged}
            isSelected={selectedTasks.includes(taskId)}
            onSelectChange={(checked) =>
              handleSelectTask(taskId, checked)
            }
          />
        );
      })}
    </div>
  );
};

export default TaskList;
