import { Building2, Users, Bike, Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
interface DashboardHeaderProps {
  activeRole: 'ho' | 'branch' | 'rider';
  onRoleChange: (role: 'ho' | 'branch' | 'rider') => void;
}
const roleConfig = {
  ho: {
    icon: Building2,
    label: "Kantor Pusat",
    description: "Manajemen Pusat",
    color: "bg-primary text-primary-foreground"
  },
  branch: {
    icon: Users,
    label: "Manajer Cabang",
    description: "Operasional Cabang",
    color: "bg-warning text-warning-foreground"
  },
  rider: {
    icon: Bike,
    label: "Mobile Seller",
    description: "Operasional Lapangan",
    color: "bg-success text-success-foreground"
  }
};
export const DashboardHeader = ({
  activeRole,
  onRoleChange
}: DashboardHeaderProps) => {
  const { userProfile } = useAuth();
  const currentConfig = roleConfig[activeRole];
  const CurrentIcon = currentConfig.icon;
  return (
    <div className="glass-card-intense p-8 rounded-[2rem] animate-slide-up wave-overlay glow-effect">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side - Role & Welcome */}
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-[1.5rem] glass-card-oval ${currentConfig.color} glow-effect relative overflow-hidden`}>
            <CurrentIcon className="w-8 h-8 relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Selamat datang kembali!
            </h1>
            <p className="text-muted-foreground font-semibold text-lg">
              Branch Hub Zeger Kemiri
            </p>
            <p className="text-muted-foreground/80 text-sm">
              {userProfile?.full_name || 'User'}
            </p>
          </div>
        </div>

        {/* Right Side - User Actions */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative glass-card-oval w-14 h-14 hover:scale-110 hover:glow-effect transition-all duration-300 border-0"
          >
            <Bell className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center text-xs gradient-bg text-white border-0 rounded-full">
              3
            </Badge>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="glass-card-oval w-14 h-14 hover:scale-110 hover:glow-effect transition-all duration-300 border-0"
          >
            <Settings className="w-6 h-6" />
          </Button>

          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-primary/40 glow-effect">
              <AvatarFallback className="gradient-bg text-white border-0">
                <User className="w-7 h-7" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-3 border-white shadow-lg glow-effect"></div>
          </div>
        </div>
      </div>
    </div>
  );
};