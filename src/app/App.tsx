import { useState, useMemo } from "react";
import { DateFilter } from "./components/DateFilter";
import { ConsumptionChart } from "./components/ConsumptionChart";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { Navigation } from "./components/Navigation";
import { Loader2 } from "lucide-react";

interface ResourceItem {
  name: string;
  amount: number;
}

interface MetricsItem {
  dateTime: string;
  resources: ResourceItem[];
  resourcesPerKg: ResourceItem[];
  totalWeight: number;
}

interface ObservedPeriod {
  resources: ResourceItem[];
  resourcesPerKg: ResourceItem[];
  totalWeight: number;
}

interface ApiResponse {
  metrics: MetricsItem[];
  observedPeriod: ObservedPeriod;
}

function getValue(list: ResourceItem[], name: string) {
  return list.find((r) => r.name === name)?.amount || 0;
}

function mapToSummary(
  resources: ResourceItem[],
  resourcesPerKg: ResourceItem[],
  totalWeight: number
) {
  return {
    vaporPerKg: getValue(resourcesPerKg, "vapor"),
    energyPerKg: getValue(resourcesPerKg, "energy"),
    newWaterPerKg: getValue(resourcesPerKg, "new-water"),
    reuseWaterPerKg: getValue(resourcesPerKg, "reuse-water"),
    hotWaterPerKg: getValue(resourcesPerKg, "hot-water"),

    vapor: getValue(resources, "vapor"),
    energy: getValue(resources, "energy"),
    newWater: getValue(resources, "new-water"),
    reuseWater: getValue(resources, "reuse-water"),
    hotWater: getValue(resources, "hot-water"),

    totalWeight
  };
}

export default function App() {
  const [startDate, setStartDate] = useState("2026-02-07T00:00");
  const [endDate, setEndDate] = useState("2026-02-24T23:59");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [perKg, setPerKg] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `http://localhost:8080/metrics?start=${encodeURIComponent(
          startDate
        )}&end=${encodeURIComponent(endDate)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error("Erro ao buscar métricas");
      }

      const responseData: ApiResponse = await response.json();

      setData(responseData);
      setSelectedIndex(null);

    } catch (err: any) {
      console.error("Erro:", err);

      if (err.name === "AbortError") {
        setError("O servidor demorou para responder (timeout).");
      } else {
        setError("Erro ao buscar dados do servidor.");
      }

      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.metrics) return [];

    if (!perKg) {
      return data.metrics.map((m, index) => ({
        name: new Date(m.dateTime).toLocaleDateString("pt-BR"),
        weight: m.totalWeight,
        index
      }));
    }

    return data.metrics.map((m, index) => {
      const result: any = {
        name: new Date(m.dateTime).toLocaleDateString("pt-BR"),
        index
      };

      m.resourcesPerKg.forEach((r) => {
        result[r.name] = r.amount;
      });

      return result;
    });
  }, [data, perKg]);

  const summaryData = useMemo(() => {
    if (!data) return null;

    if (perKg && selectedIndex !== null) {
      const metric = data.metrics[selectedIndex];

      return mapToSummary(
        metric.resources,
        metric.resourcesPerKg,
        metric.totalWeight
      );
    }

    return mapToSummary(
      data.observedPeriod.resources,
      data.observedPeriod.resourcesPerKg,
      data.observedPeriod.totalWeight
    );
  }, [data, perKg, selectedIndex]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">

          <div className="mb-8">
            <h1 className="text-4xl text-gray-900 mb-2">
              Dashboard de Consumo
            </h1>
            <p className="text-lg text-gray-600">
              Métricas por período
            </p>
          </div>

          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSearch={handleSearch}
            loading={loading}
          />

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6 mt-6">
              <ConsumptionChart
                data={chartData}
                perKg={perKg}
                setPerKg={setPerKg}
                onBarClick={(index) => setSelectedIndex(index)}
              />

              {summaryData && <SummaryMetrics data={summaryData} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}