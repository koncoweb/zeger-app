import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Store, Truck, ShoppingCart, Smartphone, Users, Package, TrendingUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { EnhancedQuickActions } from "@/components/dashboard/EnhancedQuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SalesChart } from "@/components/charts/SalesChart";
import { InventoryStatus } from "@/components/inventory/InventoryStatus";
import { RiderTracking } from "@/components/rider/RiderTracking";
const Index = () => {
  const [activeRole, setActiveRole] = useState<'ho' | 'branch' | 'rider'>('ho');
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="min-h-screen relative">
      <div className="min-h-screen relative z-10">
        <div className="container mx-auto px-8 py-8 space-y-8">
          {/* Modern Glassmorphism Header */}
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-5 rounded-[1.5rem] glass-card-oval bg-gradient-primary relative overflow-hidden">
                <Coffee className="h-12 w-12 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              <h1 className="text-5xl font-bold gradient-text">Zeger Coffee ERP</h1>
            </div>
            <p className="text-xl text-muted-foreground font-semibold">
              Sistem Manajemen Terpadu Coffee Shop & Mobile Seller
            </p>
          </div>

          {/* Dashboard Header with Role Switcher */}
          <DashboardHeader activeRole={activeRole} onRoleChange={setActiveRole} />
          
          {/* Modern Glassmorphism Dashboard Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-8 space-y-8">
              {/* Hero Glass Card - Premium Red Gradient */}
              <div className="glass-card-intense p-10 rounded-[2.5rem] bg-gradient-primary text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Total Balance</p>
                      <p className="text-3xl font-bold">Rp 2.480.000.000</p>
                      <p className="text-white/80 text-sm">•••• •••• •••• 6252</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm">Valid Thru</p>
                      <p className="text-white font-medium">12/25</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/90 font-medium">Zeger Coffee</p>
                    <div className="text-2xl font-bold">95</div>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full"></div>
              </div>

              {/* Stats Grid - Oval Cards */}
              <StatsOverview role={activeRole} />
              
              {/* Charts Section - Modern Glassmorphism */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Sales Chart - Glass Oval */}
                <div className="glass-card-oval p-8">
                  <h3 className="text-xl font-bold mb-6 gradient-text">Sales History</h3>
                  <div className="relative">
                    <SalesChart />
                  </div>
                </div>
                
                {/* Efficiency Chart - Glass Oval */}
                <div className="glass-card-oval p-8">
                  <h3 className="text-xl font-bold mb-6 gradient-text">Performance</h3>
                  <div className="flex items-center justify-center h-56">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full border-8 border-primary/20 relative shadow-lg">
                        <div className="absolute inset-3 rounded-full border-6 border-primary flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
                          <div className="text-center">
                            <div className="text-3xl font-bold gradient-text">$1,700</div>
                            <div className="text-sm text-muted-foreground font-semibold">84.5% Efficiency</div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Glass Sidebar */}
            <div className="xl:col-span-4 space-y-8">
              {/* Exchange Rates Glass Card */}
              <div className="glass-card-oval p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold gradient-text">Exchange Rates</h3>
                  <div className="text-sm text-muted-foreground font-semibold">USD → IDR</div>
                </div>
                <div className="h-24 flex items-center justify-center">
                  <div className="w-full h-10 glass-card-oval bg-gradient-to-r from-primary/20 to-accent-orange/20 flex items-center p-1">
                    <div className="h-full w-3/4 bg-gradient-primary rounded-full shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Glass Card */}
              <div className="glass-card-oval p-8">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg relative overflow-hidden">
                    <Coffee className="w-8 h-8 text-white relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg gradient-text">Jonas Kanwald</h3>
                    <p className="text-muted-foreground font-semibold">Branch Manager</p>
                  </div>
                </div>
                
                {/* Action Buttons - Modern Glass Oval */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                  <button className="glass-card-oval p-4 flex flex-col items-center gap-2 hover:scale-110 transition-all duration-300 group">
                    <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold">Top Up</span>
                  </button>
                  <button className="glass-card-oval p-4 flex flex-col items-center gap-2 hover:scale-110 transition-all duration-300 group">
                    <div className="w-8 h-8 bg-success/30 rounded-full flex items-center justify-center group-hover:bg-success/40 transition-colors">
                      <Package className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-xs font-semibold">Pay</span>
                  </button>
                  <button className="glass-card-oval p-4 flex flex-col items-center gap-2 hover:scale-110 transition-all duration-300 group">
                    <div className="w-8 h-8 bg-warning/30 rounded-full flex items-center justify-center group-hover:bg-warning/40 transition-colors">
                      <TrendingUp className="w-4 h-4 text-warning" />
                    </div>
                    <span className="text-xs font-semibold">Send</span>
                  </button>
                  <button className="glass-card-oval p-4 flex flex-col items-center gap-2 hover:scale-110 transition-all duration-300 group">
                    <div className="w-8 h-8 bg-destructive/30 rounded-full flex items-center justify-center group-hover:bg-destructive/40 transition-colors">
                      <Smartphone className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-xs font-semibold">Request</span>
                  </button>
                </div>
              </div>

              {/* Recent Transactions - Modern Glass List */}
              <div className="glass-card-oval p-8">
                <h3 className="text-xl font-bold mb-6 gradient-text">Recent Transactions</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 glass-card-oval hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg relative overflow-hidden">
                        <Coffee className="w-6 h-6 text-white relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Tom Holland</p>
                        <p className="text-xs text-muted-foreground font-medium">Payment received</p>
                      </div>
                    </div>
                    <p className="font-bold text-success text-lg">+$250</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Chris Jericho</p>
                        <p className="text-xs text-muted-foreground">Payment sent</p>
                      </div>
                    </div>
                    <p className="font-semibold text-destructive">-$100</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">John Cena</p>
                        <p className="text-xs text-muted-foreground">Payment received</p>
                      </div>
                    </div>
                    <p className="font-semibold text-success">+$250</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Chris Evans</p>
                        <p className="text-xs text-muted-foreground">Payment received</p>
                      </div>
                    </div>
                    <p className="font-semibold text-success">+$250</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Floating Button */}
              <EnhancedQuickActions role={activeRole} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Index;