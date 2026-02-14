import { useState } from "react";
import { DateFilter } from "./components/DateFilter";
import { ConsumptionChart } from "./components/ConsumptionChart";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { Loader2 } from "lucide-react";

// Mock API Response
interface LaundryItem {
  name: string;
  weight: number;
  totalVapor: number;
  totalNewWater: number;
  totalReuseWater: number;
  totalHotWater: number;
}

interface ApiResponse {
  items: LaundryItem[];
  vaporPerKg: number;
  newWaterPerKg: number;
  reuseWaterPerKg: number;
  hotWaterPerKg: number;
  vapor: number;
  newWater: number;
  reuseWater: number;
  hotWater: number;
  totalWeight: number;
}

async function fetchLaundryLoads(start: string, end: string) {
  try { 
    const response = await fetch(
      `http://10.1.0.25:8080/laundry-loads?start=${encodeURIComponent(
        start
      )}&end=${encodeURIComponent(end)}`
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar laundry loads");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
}


export default function App() {
  const [startDate, setStartDate] = useState("2026-02-07T00:00");
  const [endDate, setEndDate] = useState("2026-02-07T23:59");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  setLoading(true);

  try {
    const responseData = await fetchLaundryLoads(startDate, endDate);

    setData(responseData);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">
            Dashboard de consumo
          </h1>
          <p className="text-lg text-gray-600">
            Consumo por tipo de item
          </p>
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Charts and Metrics */}
        {!loading && data && (
          <div className="space-y-6">
            <ConsumptionChart data={data.items} />
            <SummaryMetrics
              data={{
                vaporPerKg: data.vaporPerKg,
                newWaterPerKg: data.newWaterPerKg,
                reuseWaterPerKg: data.reuseWaterPerKg,
                hotWaterPerKg: data.hotWaterPerKg,
                vapor: data.vapor,
                newWater: data.newWater,
                reuseWater: data.reuseWater,
                hotWater: data.hotWater,
                totalWeight: data.totalWeight
              }}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg">
              Selecione um período e clique em "Buscar" para visualizar os dados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
