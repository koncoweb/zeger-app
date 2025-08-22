import { Plus, Scan, FileText, Users, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  role: 'ho' | 'branch' | 'rider';
}

const actionsByRole = {
  ho: [
    { icon: Users, label: "Tambah Cabang", description: "Buat cabang baru", color: "bg-primary" },
    { icon: FileText, label: "Lihat Laporan", description: "Analisis keuangan", color: "bg-success" },
    { icon: TrendingUp, label: "Analytics", description: "Metrik performa", color: "bg-warning" },
    { icon: Package, label: "Inventori", description: "Kelola stok", color: "bg-destructive" }
  ],
  branch: [
    { icon: Users, label: "Tambah Rider", description: "Daftarkan rider baru", color: "bg-primary" },
    { icon: Package, label: "Manajemen Stok", description: "Kelola inventori", color: "bg-success" },
    { icon: FileText, label: "Laporan Rider", description: "Lihat performa", color: "bg-warning" },
    { icon: Plus, label: "Pesanan Baru", description: "Input manual", color: "bg-destructive" }
  ],
  rider: [
    { icon: Scan, label: "Scan Menu", description: "Pesanan QR code", color: "bg-primary" },
    { icon: Plus, label: "Pesanan Manual", description: "Tambah pesanan", color: "bg-success" },
    { icon: Package, label: "Cek Stok", description: "Lihat inventori", color: "bg-warning" },
    { icon: FileText, label: "Laporan Harian", description: "Kirim laporan", color: "bg-destructive" }
  ]
};

export const QuickActions = ({ role }: QuickActionsProps) => {
  const actions = actionsByRole[role];

  return (
    <div className="dashboard-card animate-slide-up">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Aksi Cepat</h3>
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