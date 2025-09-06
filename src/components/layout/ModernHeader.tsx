import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";

type UserRole = 'ho_admin' | 'ho_owner' | 'ho_staff' | 'branch_manager' | 'bh_staff' | 'bh_kasir' | 'bh_rider' | 'bh_report' | 'sb_branch_manager' | 'sb_kasir' | 'sb_rider' | 'sb_report' | 'rider' | 'finance' | 'customer';

interface Profile {
  id: string;
  role: UserRole;
  branch_id?: string;
  full_name: string;
  app_access_type?: 'web_backoffice' | 'pos_app' | 'rider_app';
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  branch_type: string;
}

interface ModernHeaderProps {
  profile: Profile;
  branch: Branch | null;
  onMenuClick: () => void;
}

export const ModernHeader = ({ profile, branch, onMenuClick }: ModernHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleDisplay = () => {
    const roleMap: { [key: string]: string } = {
      'ho_admin': 'HO Admin',
      'ho_owner': 'HO Owner',
      'ho_staff': 'HO Staff',
      'branch_manager': 'Branch Hub Manager',
      'bh_staff': 'Branch Hub Staff',
      'bh_kasir': 'Branch Hub Kasir',
      'bh_rider': 'Branch Hub Rider',
      'bh_report': 'Branch Hub Report',
      'sb_branch_manager': 'Small Branch Manager',
      'sb_kasir': 'Small Branch Kasir',
      'sb_rider': 'Small Branch Rider',
      'sb_report': 'Small Branch Report',
      'rider': 'Legacy Rider',
      'finance': 'Finance Staff',
      'customer': 'Customer'
    };
    return roleMap[profile.role] || profile.role;
  };

  return (
    <header className="sticky top-0 z-40 nav-glass px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {['ho_admin', 'ho_owner'].includes(profile.role) ? 'Dashboard' : 
               branch ? `${branch.name} Dashboard` : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                {getGreeting()}, {profile.full_name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {getRoleDisplay()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search Products"
              className="pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <NotificationSystem />

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
              <p className="text-xs text-gray-600">{getRoleDisplay()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};