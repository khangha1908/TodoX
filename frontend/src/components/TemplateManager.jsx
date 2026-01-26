import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import TemplateCard from "./TemplateCard";

const TemplateManager = ({ onTemplateSelect, templates, setTemplates, onTemplatesChange }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    category: "",
    dueDate: "",
    priority: "medium",
    description: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy categories:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/templates");
      console.log("📥 Templates from API:", res.data);
      setTemplates(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy templates:", error);
      toast.error("Không thể tải danh sách template");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error("Tên template không được để trống");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Tiêu đề công việc không được để trống");
      return;
    }

    setIsSubmitting(true);

    try {
  const trimmedData = {
    name: formData.name.trim(),
    title: formData.title.trim(),
    description: formData.description.trim(),
    priority: formData.priority,
  };

  if (formData.category) {
    trimmedData.category = formData.category;
  }

  if (formData.dueDate) {
    trimmedData.dueDate = formData.dueDate;
  }

  console.log("📤 Sending data:", trimmedData);


      if (editingTemplate) {
        const templateId = editingTemplate.id;
        console.log("🔄 Updating template ID:", templateId);
        await api.put(`/templates/${templateId}`, trimmedData);
        toast.success("Cập nhật template thành công");
      } else {
        await api.post("/templates", trimmedData);
        toast.success("Tạo template thành công");
      }

      // Refresh templates list after successful creation/update
      if (onTemplatesChange) {
        await onTemplatesChange();
      }

      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu template:", error);
      console.error("Status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Full error:", error);

      // More detailed error message
      const errorMessage = error.response?.data?.message ||
                          (error.response?.status === 400 ? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." :
                           error.response?.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." :
                           "Lỗi khi lưu template");

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    console.log("✏️ Editing template:", template);
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      category: template.category?.id || "",
      dueDate: template.dueDate ? template.dueDate.split("T")[0] : "",
      priority: template.priority,
      description: template.description,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (templateId) => {
    console.log("🗑️ handleDelete called with ID:", templateId);

    if (deletingId) {
      console.log("⛔ Already deleting, skipping...");
      return;
    }

    if (!templateId) {
      console.error("❌ Template ID is undefined or null");
      toast.error("Không thể xóa: ID template không hợp lệ");
      return;
    }

    if (window.confirm("Bạn có chắc muốn xóa template này?")) {
      try {
        setDeletingId(templateId);

        console.log("📤 Sending DELETE request:", `/templates/${templateId}`);

        await api.delete(`/templates/${templateId}`);

        console.log("✅ Delete successful");
        toast.success("Xóa template thành công");

        await fetchTemplates();

      } catch (error) {
        console.error("❌ Lỗi khi xóa template:", error);
        console.error("   Status:", error.response?.status);
        console.error("   Data:", error.response?.data);
        console.error("   URL:", error.config?.url);

        toast.error(error.response?.data?.message || "Lỗi khi xóa template");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      category: "",
      dueDate: "",
      priority: "medium",
      description: "",
    });
    setEditingTemplate(null);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Quản lý Template
        </h2>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm">
              <Plus className="size-4 mr-2" />
              Tạo Template
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Chỉnh sửa Template" : "Tạo Template Mới"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên Template</label>
                <Input
                  placeholder="Nhập tên template..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tiêu đề công việc
                </label>
                <Input
                  placeholder="Nhập tiêu đề công việc..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Danh mục</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">Không có danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>

                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <Input
                  placeholder="Nhập mô tả..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Độ ưu tiên</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày đến hạn</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingTemplate
                    ? "Cập nhật"
                    : "Tạo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(templates) &&
          templates.map((template) => {
            const templateId = template.id;
            return (
              <TemplateCard
                key={templateId}
                template={template}
                onSelect={() => onTemplateSelect(template)}
                onEdit={() => handleEdit(template)}
                onDelete={() => handleDelete(templateId)}
                isDeleting={deletingId === templateId}
              />
            );
          })}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Chưa có template nào
          </h3>
          <p className="text-muted-foreground mb-4">
            Tạo template đầu tiên để tiết kiệm thời gian khi thêm công việc lặp
            lại.
          </p>
          <Button
            variant="gradient"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="size-4 mr-2" />
            Tạo Template Đầu Tiên
          </Button>
        </Card>
      )}
    </div>
  );
};

export default TemplateManager;