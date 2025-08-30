import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from "lucide-react";

interface StatsOverviewProps {
  role: 'ho' | 'branch' | 'rider';
}

const statsData = {
  ho: [
    {
      title: "Total Pendapatan",
      value: "Rp 2.480.000.000",
      change: "+12,5%",
      trend: "up",
      icon: DollarSign,
      description: "Semua cabang gabungan"
    },
    {
      title: "Cabang Aktif",
      value: "15",
      change: "+2",
      trend: "up",
      icon: Users,
      description: "Cabang beroperasi"
    },
    {
      title: "Total Rider",
      value: "45",
      change: "+5",
      trend: "up",
      icon: Users,
      description: "Mobile seller aktif"
    },
    {
      title: "Produk Terjual",
      value: "12.450",
      change: "+18,2%",
      trend: "up",
      icon: ShoppingCart,
      description: "Bulan ini"
    }
  ],
  branch: [
    {
      title: "Pendapatan Cabang",
      value: "Rp 165.000.000",
      change: "+8,3%",
      trend: "up",
      icon: DollarSign,
      description: "Bulan ini"
    },
    {
      title: "Rider Aktif",
      value: "3",
      change: "0",
      trend: "stable",
      icon: Users,
      description: "Ditugaskan ke cabang"
    },
    {
      title: "Pesanan Hari Ini",
      value: "87",
      change: "+12",
      trend: "up",
      icon: ShoppingCart,
      description: "Semua rider gabungan"
    },
    {
      title: "Level Stok",
      value: "85%",
      change: "-5%",
      trend: "down",
      icon: Package,
      description: "Status inventori"
    }
  ],
  rider: [
    {
      title: "Penjualan Harian",
      value: "Rp 1.250.000",
      change: "+15,2%",
      trend: "up",
      icon: DollarSign,
      description: "Pendapatan hari ini"
    },
    {
      title: "Pesanan Selesai",
      value: "28",
      change: "+3",
      trend: "up",
      icon: ShoppingCart,
      description: "Hari ini"
    },
    {
      title: "Komisi",
      value: "Rp 125.000",
      change: "+15,2%",
      trend: "up",
      icon: TrendingUp,
      description: "Komisi hari ini"
    },
    {
      title: "Sisa Stok",
      value: "72%",
      change: "-28%",
      trend: "down",
      icon: Package,
      description: "Perlu restok segera"
    }
  ]
};

export const StatsOverview = ({ role }: StatsOverviewProps) => {
  const stats = statsData[role];
  // Route mapping per kartu
  const getRouteForStat = (title: string) => {
    const map: Record<string, string> = {
      'Total Pendapatan': '/reports/transactions',
      'Cabang Aktif': '/branches',
      'Total Rider': '/riders',
      'Produk Terjual': '/reports/transactions',
      'Pendapatan Cabang': '/reports/transactions',
      'Rider Aktif': '/riders',
      'Pesanan Hari Ini': '/reports/transactions',
      'Level Stok': '/pos',
      'Penjualan Harian': '/reports/transactions',
      'Pesanan Selesai': '/reports/transactions',
      'Komisi': '/reports/transactions',
      'Sisa Stok': '/mobile-seller'
    };
    return map[title] || '/';
  };
  
  // Use navigate lazily to avoid import churn on SSR
  const handleClick = (path: string) => {
    import('react-router-dom').then(({ useNavigate }) => {}).catch(()=>{});
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === "up";
        const isNegative = stat.trend === "down";
        const path = getRouteForStat(stat.title);
        
        return (
          <a
            key={stat.title}
            href={path}
            className="glass-card-oval p-8 group hover:scale-105 hover:glow-effect transition-all duration-500 cursor-pointer block fade-in wave-overlay"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-[1.2rem] glass-card-oval ${
                isPositive ? 'bg-success/30 text-success border border-success/40 glow-effect' :
                isNegative ? 'bg-destructive/30 text-destructive border border-destructive/40' :
                'bg-primary/30 text-primary border border-primary/40 glow-effect'
              } backdrop-blur-lg relative overflow-hidden`}>
                <Icon className="w-7 h-7 relative z-10" />
              </div>
              <div className={`pill-${isPositive ? 'active' : isNegative ? 'inactive' : 'neutral'} text-sm font-bold`}>
                {isPositive && <TrendingUp className="w-4 h-4" />}
                {isNegative && <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-3xl font-bold text-foreground group-hover:gradient-text transition-all duration-300">
                {stat.value}
              </p>
              <p className="text-base font-bold text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {stat.description}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
};