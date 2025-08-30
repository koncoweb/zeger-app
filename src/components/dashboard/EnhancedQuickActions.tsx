import { useState } from "react";
import { Plus, Scan, FileText, Users, Package, TrendingUp, Smartphone, Coffee, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EnhancedQuickActionsProps {
  role: 'ho' | 'branch' | 'rider';
}

const actionsByRole = {
  ho: [
    { 
      icon: Users, 
      label: "Kelola Cabang", 
      description: "Buat cabang baru", 
      color: "bg-primary",
      action: "manage_branches",
      route: "/branches"
    },
    { 
      icon: FileText, 
      label: "Lihat Laporan", 
      description: "Analisis keuangan", 
      color: "bg-success",
      action: "view_reports",
      route: "/reports/transactions"
    },
    { 
      icon: TrendingUp, 
      label: "Analytics", 
      description: "Metrik performa", 
      color: "bg-warning",
      action: "analytics",
      route: "/reports/transactions"
    },
    { 
      icon: Package, 
      label: "Inventori", 
      description: "Kelola stok", 
      color: "bg-destructive",
      action: "inventory",
      route: "/inventory"
    }
  ],
  branch: [
    { 
      icon: Users, 
      label: "Tambah Rider", 
      description: "Daftarkan rider baru", 
      color: "bg-primary",
      action: "add_rider",
      route: "/admin/users"
    },
    { 
      icon: Package, 
      label: "Manajemen Stok", 
      description: "Kelola inventori", 
      color: "bg-success",
      action: "stock_management",
      route: "/inventory"
    },
    { 
      icon: FileText, 
      label: "Laporan Rider", 
      description: "Lihat performa", 
      color: "bg-warning",
      action: "rider_reports",
      route: "/riders"
    },
    { 
      icon: Plus, 
      label: "Pesanan Baru", 
      description: "Input manual", 
      color: "bg-destructive",
      action: "new_order",
      route: "/pos"
    }
  ],
  rider: [
    { 
      icon: Scan, 
      label: "Scan Menu", 
      description: "Pesanan QR code", 
      color: "bg-primary",
      action: "scan_menu",
      route: "/mobile-seller"
    },
    { 
      icon: Plus, 
      label: "Pesanan Manual", 
      description: "Tambah pesanan", 
      color: "bg-success",
      action: "manual_order",
      route: "/mobile-seller"
    },
    { 
      icon: Package, 
      label: "Cek Stok", 
      description: "Lihat inventori", 
      color: "bg-warning",
      action: "check_stock",
      route: "/mobile-seller"
    },
    { 
      icon: FileText, 
      label: "Laporan Harian", 
      description: "Kirim laporan", 
      color: "bg-destructive",
      action: "daily_report",
      route: "/mobile-seller"
    }
  ]
};

export const EnhancedQuickActions = ({ role }: EnhancedQuickActionsProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const navigate = useNavigate();
  const actions = actionsByRole[role];

  const handleActionClick = (action: any) => {
    // Navigate to route if available
    if (action.route) {
      toast.success(`Navigasi ke ${action.label}`);
      navigate(action.route);
    } else {
      // Show dialog for actions without routes
      setSelectedAction(action.action);
      setShowDialog(true);
    }
  };

  const getDialogContent = () => {
    switch (selectedAction) {
      case "scan_menu":
        return (
          <div className="text-center py-6">
            <Scan className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Scan QR Menu</h3>
            <p className="text-muted-foreground mb-4">
              Arahkan kamera ke QR code menu untuk melihat daftar produk
            </p>
            <Button onClick={() => setShowDialog(false)} className="w-full">
              <Coffee className="w-4 h-4 mr-2" />
              Buka Kamera
            </Button>
          </div>
        );
      case "add_rider":
        return (
          <div className="text-center py-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Tambah Rider Baru</h3>
            <p className="text-muted-foreground mb-4">
              Fitur ini akan membuka form pendaftaran rider baru
            </p>
            <Button onClick={() => setShowDialog(false)} className="w-full">
              Lanjutkan ke Form
            </Button>
          </div>
        );
      default:
        return (
          <div className="text-center py-6">
            <Package className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Fitur Dalam Pengembangan</h3>
            <p className="text-muted-foreground mb-4">
              Fitur ini sedang dalam tahap pengembangan dan akan segera tersedia
            </p>
            <Button onClick={() => setShowDialog(false)} className="w-full">
              Tutup
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="glass-card-intense rounded-[2rem] p-8 animate-slide-up wave-overlay">
      <h3 className="text-xl font-bold mb-6 gradient-text">Aksi Cepat</h3>
      <div className="grid grid-cols-2 gap-5">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              className="h-auto p-6 flex flex-col items-center gap-4 glass-card-oval hover:scale-105 hover:glow-effect transition-all duration-500 border-0 group"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleActionClick(action)}
            >
              <div className={`p-4 rounded-[1.2rem] ${action.color} text-white glow-effect relative overflow-hidden group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 relative z-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-foreground group-hover:gradient-text transition-all duration-300">{action.label}</p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md glass-card-intense border-0 rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Aksi Cepat</DialogTitle>
          </DialogHeader>
          {getDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};