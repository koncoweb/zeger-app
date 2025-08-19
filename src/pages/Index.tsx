import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SalesChart } from "@/components/charts/SalesChart";
import { InventoryStatus } from "@/components/inventory/InventoryStatus";
import { RiderTracking } from "@/components/rider/RiderTracking";

const Index = () => {
  const [activeRole, setActiveRole] = useState<'ho' | 'branch' | 'rider'>('ho');

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <DashboardHeader activeRole={activeRole} onRoleChange={setActiveRole} />
        
        {/* Stats Overview */}
        <StatsOverview role={activeRole} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Chart */}
            <div className="dashboard-card animate-slide-up">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Sales Performance</h3>
              <SalesChart />
            </div>
            
            {/* Recent Activity */}
            <RecentActivity role={activeRole} />
          </div>
          
          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions role={activeRole} />
            
            {/* Inventory Status */}
            <InventoryStatus role={activeRole} />
            
            {/* Rider Tracking (for Branch/HO) */}
            {(activeRole === 'ho' || activeRole === 'branch') && (
              <RiderTracking role={activeRole} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;