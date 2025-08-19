import { Plus, Scan, FileText, Users, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  role: 'ho' | 'branch' | 'rider';
}

const actionsByRole = {
  ho: [
    { icon: Users, label: "Add Branch", description: "Create new branch", color: "bg-primary" },
    { icon: FileText, label: "View Reports", description: "Financial analysis", color: "bg-success" },
    { icon: TrendingUp, label: "Analytics", description: "Performance metrics", color: "bg-warning" },
    { icon: Package, label: "Inventory", description: "Manage stock", color: "bg-destructive" }
  ],
  branch: [
    { icon: Users, label: "Add Rider", description: "Assign new rider", color: "bg-primary" },
    { icon: Package, label: "Stock Management", description: "Manage inventory", color: "bg-success" },
    { icon: FileText, label: "Rider Reports", description: "View performance", color: "bg-warning" },
    { icon: Plus, label: "New Order", description: "Manual entry", color: "bg-destructive" }
  ],
  rider: [
    { icon: Scan, label: "Scan Menu", description: "QR code order", color: "bg-primary" },
    { icon: Plus, label: "Manual Order", description: "Add new order", color: "bg-success" },
    { icon: Package, label: "Check Stock", description: "View inventory", color: "bg-warning" },
    { icon: FileText, label: "Daily Report", description: "Submit report", color: "bg-destructive" }
  ]
};

export const QuickActions = ({ role }: QuickActionsProps) => {
  const actions = actionsByRole[role];

  return (
    <div className="dashboard-card animate-slide-up">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center gap-2 glass-card hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-3 rounded-xl ${action.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};