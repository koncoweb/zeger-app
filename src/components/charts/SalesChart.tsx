import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const salesData = [
  { day: "Mon", sales: 2400, orders: 45 },
  { day: "Tue", sales: 1398, orders: 32 },
  { day: "Wed", sales: 9800, orders: 87 },
  { day: "Thu", sales: 3908, orders: 56 },
  { day: "Fri", sales: 4800, orders: 78 },
  { day: "Sat", sales: 3800, orders: 65 },
  { day: "Sun", sales: 4300, orders: 72 }
];

export const SalesChart = () => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="day" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
            formatter={(value, name) => [
              `Rp ${value.toLocaleString()}`,
              name === 'sales' ? 'Revenue' : 'Orders'
            ]}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#salesGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};