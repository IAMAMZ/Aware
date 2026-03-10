import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';


export const chartColors = {
  primary: '#169B62',
  primaryLight: '#1DB954',
  textMain: '#F5F5F5',
  textMuted: '#8BAF95',
  border: '#1E3D28',
  card: '#122A1A',
  danger: '#B03020',
  warning: '#C96A10'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
        <p className="text-text-main font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface BaseChartProps {
  data: any[];
  height?: number;
  className?: string;
}

export function TrendChart({ data, height = 300, className }: BaseChartProps & { dataKey: string, lineName: string }) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke={chartColors.textMuted} 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={chartColors.textMuted} 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            name={arguments[0]?.lineName || "Value"}
            stroke={chartColors.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({ data, height = 300, className }: BaseChartProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke={chartColors.textMuted} 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={chartColors.textMuted} 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
