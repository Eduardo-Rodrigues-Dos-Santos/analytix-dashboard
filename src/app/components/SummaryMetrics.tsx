import { Card } from "./ui/card";
import {
  Droplets,
  Flame,
  Recycle,
  ThermometerSun,
  Weight,
  Zap
} from "lucide-react";

interface SummaryData {
  vaporPerKg: number;
  energyPerKg: number;
  newWaterPerKg: number;
  reuseWaterPerKg: number;
  hotWaterPerKg: number;

  vapor: number;
  energy: number;
  newWater: number;
  reuseWater: number;
  hotWater: number;
  totalWeight: number;
}

interface SummaryMetricsProps {
  data: SummaryData;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
}

function MetricCard({ icon, label, value, unit, color }: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl text-gray-900">
          {value.toFixed(2)}{" "}
          <span className="text-lg text-gray-500">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export function SummaryMetrics({ data }: SummaryMetricsProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <h2 className="text-2xl mb-6 text-gray-800">
        Resumo Total do Período
      </h2>

 
      <div className="mb-8">
        <h3 className="text-lg mb-4 text-gray-700">Indicadores por Kg</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={<Flame className="w-6 h-6 text-orange-600" />}
            label="Vapor por Kg"
            value={data.vaporPerKg}
            unit="kg/kg"
            color="bg-orange-100"
          />

          <MetricCard
            icon={<Zap className="w-6 h-6 text-yellow-600" />}
            label="Energia por Kg"
            value={data.energyPerKg}
            unit="kW/kg"
            color="bg-yellow-100"
          />

          <MetricCard
            icon={<Droplets className="w-6 h-6 text-blue-600" />}
            label="Água Nova por Kg"
            value={data.newWaterPerKg}
            unit="L/kg"
            color="bg-blue-100"
          />

          <MetricCard
            icon={<Recycle className="w-6 h-6 text-green-600" />}
            label="Água Reuso por Kg"
            value={data.reuseWaterPerKg}
            unit="L/kg"
            color="bg-green-100"
          />

          <MetricCard
            icon={<ThermometerSun className="w-6 h-6 text-purple-600" />}
            label="Água Quente por Kg"
            value={data.hotWaterPerKg}
            unit="L/kg"
            color="bg-purple-100"
          />
        </div>
      </div>

      {/* Totais Gerais */}
      <div>
        <h3 className="text-lg mb-4 text-gray-700">Totais Gerais</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<Weight className="w-6 h-6 text-gray-600" />}
            label="Peso Total"
            value={data.totalWeight}
            unit="kg"
            color="bg-gray-100"
          />

          <MetricCard
            icon={<Flame className="w-6 h-6 text-orange-600" />}
            label="Vapor Total"
            value={data.vapor}
            unit="kg"
            color="bg-orange-100"
          />

          <MetricCard
            icon={<Zap className="w-6 h-6 text-yellow-600" />}
            label="Energia Total"
            value={data.energy}
            unit="kW"
            color="bg-yellow-100"
          />

          <MetricCard
            icon={<Droplets className="w-6 h-6 text-blue-600" />}
            label="Água Nova Total"
            value={data.newWater}
            unit="L"
            color="bg-blue-100"
          />

          <MetricCard
            icon={<Recycle className="w-6 h-6 text-green-600" />}
            label="Água Reuso Total"
            value={data.reuseWater}
            unit="L"
            color="bg-green-100"
          />

          <MetricCard
            icon={<ThermometerSun className="w-6 h-6 text-purple-600" />}
            label="Água Quente Total"
            value={data.hotWater}
            unit="L"
            color="bg-purple-100"
          />
        </div>
      </div>
    </Card>
  );
}
