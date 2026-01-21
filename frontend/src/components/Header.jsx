import React, { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { LogIn, UserPlus, LogOut, Moon, Sun, User, Camera, Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export const Header = () => {
  const { user, logout, refreshUser } = useAuth(); // ⭐ Thêm refreshUser
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (2MB cho avatar)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 2MB");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Đang upload avatar...");

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('📤 Uploading avatar...'); // Debug log

      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload response:', response.data); // Debug log

      toast.dismiss(loadingToast);
      toast.success("Avatar đã được cập nhật thành công!");

      // ⭐ Refresh user data từ server
      if (refreshUser) {
        await refreshUser();
      } else {
        // Fallback: reload page nếu không có refreshUser function
        setTimeout(() => window.location.reload(), 500);
      }

    } catch (error) {
      console.error("❌ Lỗi khi upload avatar:", error);
      toast.dismiss(loadingToast);
      
      // Hiển thị error message chi tiết hơn
      const errorMessage = error.response?.data?.message || "Lỗi khi upload avatar";
      toast.error(errorMessage);
    }
  };

  const handleBackup = async () => {
    const loadingToast = toast.loading("Đang tạo backup...");

    try {
      console.log('📦 Creating backup...'); // Debug log

      const response = await api.post('/tasks/backup', {}, {
        responseType: 'blob' // Handle both JSON and blob responses
      });

      // Check if response is JSON (Azure configured) or blob (direct download)
      if (response.headers['content-type']?.includes('application/json')) {
        const { backupUrl } = response.data;
        console.log('✅ Backup created:', backupUrl); // Debug log

        // Download file from URL
        const link = document.createElement('a');
        link.href = backupUrl;
        link.download = `todox_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.target = '_blank'; // Open in new tab for SAS URLs
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Direct download (Azure not configured)
        console.log('✅ Backup created (direct download)'); // Debug log

        // Create blob URL for download
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todox_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.dismiss(loadingToast);
      toast.success("Sao lưu thành công! File đang được tải xuống...");

    } catch (error) {
      console.error("❌ Lỗi khi sao lưu:", error);
      toast.dismiss(loadingToast);

      const errorMessage = error.response?.data?.message || "Lỗi khi tạo backup";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-4 text-center">
      {/* Theme Toggle Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute top-4 right-4"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      {/* Logo & Title */}
      <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">TodoX</h1>
      <p className="text-muted-foreground">Không có việc gì khó, chỉ sợ mình không làm</p>

      {/* Not Logged In - Show Login/Register Buttons */}
      {!user && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="gradient" size="lg">
            <Link to="/login">
              <LogIn className="mr-2 h-5 w-5" />
              Đăng nhập
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/register">
              <UserPlus className="mr-2 h-5 w-5" />
              Đăng ký
            </Link>
          </Button>
        </div>
      )}

      {/* Logged In - Show User Info */}
      {user && (
        <div className="flex flex-col items-center gap-4">
          {/* Avatar & User Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                  onError={(e) => {
                    // Fallback nếu image load fail
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <User className="w-6 h-6 text-primary" />
                </div>
              )}
              
              {/* Camera Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={triggerFileInput}
                title="Thay đổi avatar"
              >
                <Camera className="w-3 h-3" />
              </Button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Name & Email */}
            <div className="text-left">
              <p className="font-medium text-foreground">Xin chào, {user.username || user.name}!</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Backup Button */}
            <Button onClick={handleBackup} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Sao lưu dữ liệu
            </Button>

            {/* Logout Button */}
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};