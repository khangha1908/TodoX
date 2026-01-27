import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, Edit, Trash2, Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const TemplateCard = ({ template, onSelect, onEdit, onDelete, isDeleting }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="space-y-3">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="size-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate text-sm">
              {template.name}
            </h3>
          </div>

          {/* Action menu - only visible on hover */}
          <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="size-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4 mr-2" />
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {template.title}
          </p>

          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Footer with metadata and use button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getPriorityColor(template.priority)}`}>
              {template.priority === "high" ? "Cao" :
               template.priority === "medium" ? "Trung bình" : "Thấp"}
            </Badge>

            {template.dueDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(template.dueDate)}
              </span>
            )}
          </div>

          {/* Use button - more prominent */}
          <Button
            variant="gradient"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="h-8 px-4 text-xs font-medium flex-shrink-0"
          >
            <Play className="size-3 mr-1.5" />
            Sử dụng
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
