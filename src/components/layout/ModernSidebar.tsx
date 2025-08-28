import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { ZegerLogo } from "@/components/ui/zeger-logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  roles?: string[];
}

interface ModernSidebarProps {
  userRole: string;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/admin", roles: ["ho_admin", "branch_manager"] },
  { id: "finance", label: "Finance", icon: DollarSign, path: "/finance", roles: ["ho_admin", "branch_manager"] },
  { id: "orders", label: "Orders", icon: ShoppingCart, path: "/transactions", roles: ["ho_admin", "branch_manager"] },
  { id: "products", label: "Products", icon: Package, path: "/inventory", roles: ["ho_admin", "branch_manager"] },
  { id: "sales", label: "Sales", icon: BarChart3, path: "/sales", roles: ["ho_admin", "branch_manager"] },
  { id: "users", label: "Users", icon: Users, path: "/admin-users", roles: ["ho_admin", "branch_manager"] },
  { id: "report", label: "Report", icon: FileText, path: "/reports", roles: ["ho_admin", "branch_manager"] },
  { id: "help", label: "Help & Support", icon: HelpCircle, path: "/help", roles: ["ho_admin", "branch_manager"] },
  { id: "setting", label: "Setting", icon: Settings, path: "/settings", roles: ["ho_admin", "branch_manager"] },
];

export const ModernSidebar = ({ userRole, isOpen, onToggle }: ModernSidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      toast.success("Berhasil logout");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Gagal logout: " + error.message);
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-primary text-primary-foreground z-50 transition-all duration-300 ease-in-out flex flex-col",
        isOpen ? "w-64" : "w-20",
        "lg:relative lg:translate-x-0",
        !isOpen && "lg:w-20"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-primary-light/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">gk</span>
              </div>
              {isOpen && (
                <div>
                  <h2 className="font-semibold text-sm">Zeger</h2>
                  <p className="text-xs text-primary-foreground/70">Coffee & More</p>
                </div>
              )}
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-primary-light/20 transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-white/20 text-white shadow-lg" 
                    : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {!isOpen && (
                  <div className="absolute left-16 bg-primary-dark text-white px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-light/20">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left group",
              "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isOpen && (
              <span className="font-medium text-sm">Logout</span>
            )}
            {!isOpen && (
              <div className="absolute left-16 bg-primary-dark text-white px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};