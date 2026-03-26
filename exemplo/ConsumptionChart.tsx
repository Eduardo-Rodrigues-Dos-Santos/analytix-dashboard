import { Card } from "./ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useState } from "react";
import { BarChart2, LineChart as LineChartIcon } from "lucide-react";

interface Props {
  data: any[];
  perKg: boolean;
  setPerKg: (value: boolean) => void;
  onBarClick: (index: number) => void;
}

type ViewMode = "bar" | "line";

export function ConsumptionChart({
  data,
  perKg,
  setPerKg,
  onBarClick
}: Props) {

  const [view, setView] = useState<ViewMode>("bar");

  const formatNumber = (value: number) =>
    value?.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const handleClick = (state: any) => {
    if (!state || state.activeTooltipIndex == null) return;
    onBarClick(state.activeTooltipIndex);
  };

  const chartContent = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

      <XAxis
        dataKey="name"
        angle={-35}
        textAnchor="end"
        height={120}
        interval={0}
        tick={{ fill: "#4B5563", fontSize: 12 }}
      />

      <YAxis
        width={100}
        tickFormatter={formatNumber}
        tick={{ fill: "#4B5563", fontSize: 12 }}
      />

      <Tooltip formatter={(value: number) => formatNumber(value)} />
      <Legend />

      {!perKg ? (
        view === "bar" ? (
          <Bar
            dataKey="weight"
            name="Peso Total"
            fill="#6B7280"
            radius={[4, 4, 0, 0]}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="weight"
            name="Peso Total"
            stroke="#6B7280"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        )
      ) : (
        <>
          {view === "bar" ? (
            <>
              <Bar dataKey="new-water" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="reuse-water" fill="#10B981" radius={[4,4,0,0]} />
              <Bar dataKey="vapor" fill="#F97316" radius={[4,4,0,0]} />
              <Bar dataKey="energy" fill="#EAB308" radius={[4,4,0,0]} />
              <Bar dataKey="hot-water" fill="#8B5CF6" radius={[4,4,0,0]} />
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="new-water"
                name="Água Nova"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="reuse-water"
                name="Água Reuso"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="vapor"
                name="Vapor"
                stroke="#F97316"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                name="Energia"
                stroke="#EAB308"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="hot-water"
                name="Água Quente"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">

        {/* ESQUERDA: toggle de gráfico com ícones */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              view === "bar" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setView("bar")}
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <button
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              view === "line" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setView("line")}
          >
            <LineChartIcon className="w-4 h-4" />
          </button>
        </div>

        {/* TÍTULO */}
        <h2 className="text-2xl text-gray-800">
          Métricas
        </h2>

        {/* DIREITA: toggle peso / recursos */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-md ${
              !perKg ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setPerKg(false)}
          >
            Peso
          </button>

          <button
            className={`px-4 py-2 rounded-md ${
              perKg ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setPerKg(true)}
          >
            Recursos
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={520}>
        {view === "bar" ? (
          <BarChart data={data} onClick={handleClick}>
            {chartContent}
          </BarChart>
        ) : (
          <LineChart data={data} onClick={handleClick}>
            {chartContent}
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}