import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";

interface StatsOverviewProps {
  role: 'ho' | 'branch' | 'rider';
}

const statsData = {
  ho: [
    {
      title: "Total Revenue",
      value: "Rp 2,480,000,000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      description: "All branches combined"
    },
    {
      title: "Active Branches",
      value: "15",
      change: "+2",
      trend: "up",
      icon: Users,
      description: "Operating branches"
    },
    {
      title: "Total Riders",
      value: "45",
      change: "+5",
      trend: "up",
      icon: Users,
      description: "Active mobile sellers"
    },
    {
      title: "Products Sold",
      value: "12,450",
      change: "+18.2%",
      trend: "up",
      icon: ShoppingCart,
      description: "This month"
    }
  ],
  branch: [
    {
      title: "Branch Revenue",
      value: "Rp 165,000,000",
      change: "+8.3%",
      trend: "up",
      icon: DollarSign,
      description: "This month"
    },
    {
      title: "Active Riders",
      value: "3",
      change: "0",
      trend: "stable",
      icon: Users,
      description: "Assigned to branch"
    },
    {
      title: "Orders Today",
      value: "87",
      change: "+12",
      trend: "up",
      icon: ShoppingCart,
      description: "All riders combined"
    },
    {
      title: "Stock Level",
      value: "85%",
      change: "-5%",
      trend: "down",
      icon: Package,
      description: "Inventory status"
    }
  ],
  rider: [
    {
      title: "Daily Sales",
      value: "Rp 1,250,000",
      change: "+15.2%",
      trend: "up",
      icon: DollarSign,
      description: "Today's earnings"
    },
    {
      title: "Orders Completed",
      value: "28",
      change: "+3",
      trend: "up",
      icon: ShoppingCart,
      description: "Today"
    },
    {
      title: "Commission",
      value: "Rp 125,000",
      change: "+15.2%",
      trend: "up",
      icon: TrendingUp,
      description: "Today's commission"
    },
    {
      title: "Stock Remaining",
      value: "72%",
      change: "-28%",
      trend: "down",
      icon: Package,
      description: "Need restock soon"
    }
  ]
};

export const StatsOverview = ({ role }: StatsOverviewProps) => {
  const stats = statsData[role];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === "up";
        const isNegative = stat.trend === "down";
        
        return (
          <div
            key={stat.title}
            className="dashboard-card group hover:scale-105 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${
                isPositive ? 'bg-success/10 text-success' :
                isNegative ? 'bg-destructive/10 text-destructive' :
                'bg-primary/10 text-primary'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                isPositive ? 'bg-success/10 text-success' :
                isNegative ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {isPositive && <TrendingUp className="w-3 h-3" />}
                {isNegative && <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};