import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { LogIn, UserPlus, LogOut, Moon, Sun } from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-4 text-center">
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
      <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">TodoX</h1>
      <p className="text-muted-foreground">Không có việc gì khó, chỉ sợ mình không làm</p>
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
      {user && (
        <div className="flex justify-center">
          <Button onClick={logout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      )}
    </div>
  );
};
