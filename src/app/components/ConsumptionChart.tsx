import { Card } from "./ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface LaundryItem {
  name: string;
  weight: number;
  totalVapor: number;
  totalNewWater: number;
  totalReuseWater: number;
  totalHotWater: number;
}

interface ConsumptionChartProps {
  data: LaundryItem[];
}

const COLORS = {
  weight: "#6B7280",
  totalVapor: "#F97316", 
  totalNewWater: "#3B82F6",
  totalReuseWater: "#10B981",
  totalHotWater: "#8B5CF6"
};

const LABELS = {
  weight: "Peso (kg)",
  totalVapor: "Vapor (kg)",
  totalNewWater: "Água Nova (L)",
  totalReuseWater: "Água Reuso (L)",
  totalHotWater: "Água Quente (L)"
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const unit = entry.dataKey === "weight" || entry.dataKey === "totalVapor" ? "kg" : "L";
          return (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {LABELS[entry.dataKey as keyof typeof LABELS]}: {entry.value.toFixed(2)} {unit}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <h2 className="text-2xl mb-6 text-gray-800">
        Consumo por Tipo de Roupa
      </h2>
      
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fill: '#4B5563', fontSize: 12 }}
          />
          <YAxis tick={{ fill: '#4B5563', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => LABELS[value as keyof typeof LABELS]}
          />
          
          <Bar dataKey="weight" fill={COLORS.weight} radius={[4, 4, 0, 0]} />
          <Bar dataKey="totalVapor" fill={COLORS.totalVapor} radius={[4, 4, 0, 0]} />
          <Bar dataKey="totalNewWater" fill={COLORS.totalNewWater} radius={[4, 4, 0, 0]} />
          <Bar dataKey="totalReuseWater" fill={COLORS.totalReuseWater} radius={[4, 4, 0, 0]} />
          <Bar dataKey="totalHotWater" fill={COLORS.totalHotWater} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
