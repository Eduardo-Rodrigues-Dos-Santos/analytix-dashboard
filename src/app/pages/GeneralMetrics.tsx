import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import {
  Activity,
  BarChart3,
  Droplets,
  Flame,
  LineChart as LineChartIcon,
  Loader2,
  Recycle,
  Search,
  ThermometerSun,
  TrendingUp,
  Weight,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiJson } from "../lib/api";

type ChartType = "bar" | "line";

interface ResourceModel {
  name: string;
  value: number;
}

interface DailyProductionModel {
  producedAt: string;
  weight: number;
}

interface LaundryMetricsResponse {
  productions: DailyProductionModel[];
  totalWeight: number;
  resources: ResourceModel[];
  resourcesPerKg: ResourceModel[];
}

interface ResourceDailyMatricsModel {
  consumedAt: string;
  resourceName: string;
  weight: number;
  value: number;
  valuePerKg: number;
}

interface ResourceMetricsResponse {
  resourceMetrics: ResourceDailyMatricsModel[];
}

function normalizeDateTimeLocal(value: string) {
  // `datetime-local` usually returns `YYYY-MM-DDTHH:mm` (no seconds)
  return value.length === 16 ? value + ":00" : value;
}

function formatLocalDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(date.getFullYear()) +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

function buildDefaultRange(daysBack: number = 15) {
  const now = new Date();

  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  return {
    startDate: formatLocalDateTime(start),
    endDate: formatLocalDateTime(end),
  };
}

function displayResourceName(name: string) {
  return String(name ?? "").trim();
}

function normalizeResourceKey(name: string) {
  return String(name ?? "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortResourcesByReferenceOrder(
  reference: ResourceModel[] | undefined,
  items: ResourceModel[] | undefined,
) {
  const list = items ?? [];
  if (!reference || reference.length === 0) return list;

  const order = new Map<string, number>();
  reference.forEach((r, idx) => {
    order.set(normalizeResourceKey(r.name), idx);
  });

  return [...list].sort((a, b) => {
    const ia = order.get(normalizeResourceKey(a.name));
    const ib = order.get(normalizeResourceKey(b.name));

    if (ia != null && ib != null) return ia - ib;
    if (ia != null) return -1;
    if (ib != null) return 1;
    return a.name.localeCompare(b.name);
  });
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const FALLBACK_VISUALS = [
  { chartColor: "#3B82F6", bg: "bg-blue-100" },
  { chartColor: "#10B981", bg: "bg-green-100" },
  { chartColor: "#F59E0B", bg: "bg-yellow-100" },
  { chartColor: "#8B5CF6", bg: "bg-purple-100" },
  { chartColor: "#EF4444", bg: "bg-red-100" },
  { chartColor: "#06B6D4", bg: "bg-cyan-100" },
  { chartColor: "#F97316", bg: "bg-orange-100" },
];

function resourceVisual(name: string) {
  const key = normalizeResourceKey(name);

  if (key.includes("reuse") || key.includes("reuso")) {
    return {
      icon: <Recycle className="w-6 h-6 text-green-600" />,
      bg: "bg-green-100",
      chartColor: "#10B981",
    };
  }

  if (key.includes("new") || key.includes("nova")) {
    return {
      icon: <Droplets className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      chartColor: "#3B82F6",
    };
  }

  if (key.includes("hot") || key.includes("quente")) {
    return {
      icon: <ThermometerSun className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-100",
      chartColor: "#8B5CF6",
    };
  }

  if (key.includes("water") || key.includes("agua")) {
    return {
      icon: <Droplets className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-100",
      chartColor: "#3B82F6",
    };
  }

  if (key.includes("energy") || key.includes("energia")) {
    return {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      bg: "bg-yellow-100",
      chartColor: "#F59E0B",
    };
  }

  if (key.includes("vapor") || key.includes("steam") || key.includes("gas")) {
    return {
      icon: <Flame className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-100",
      chartColor: "#F97316",
    };
  }

  const fallback = FALLBACK_VISUALS[hashString(key) % FALLBACK_VISUALS.length];
  return {
    icon: <Activity className="w-6 h-6 text-gray-600" />,
    bg: fallback.bg,
    chartColor: fallback.chartColor,
  };
}

function MetricCard({
  label,
  value,
  icon,
  color,
  precision = 2,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  precision?: number;
}) {
  const formattedValue = Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-gray-900 leading-tight break-all">{formattedValue}</p>
      </div>
    </div>
  );
}

export function GeneralMetrics() {
  const defaults = useMemo(() => buildDefaultRange(20), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [loading, setLoading] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [data, setData] = useState<LaundryMetricsResponse | null>(null);
  const [resourceData, setResourceData] = useState<ResourceMetricsResponse | null>(null);
  const [selectedResourceDayIndex, setSelectedResourceDayIndex] = useState<number | null>(null);
  const [visibleResourceKeys, setVisibleResourceKeys] = useState<string[]>([]);
  const [resourceSelectionTouched, setResourceSelectionTouched] = useState(false);

  const productions = data?.productions ?? [];
  const observed = data;

  const resourceMetrics = resourceData?.resourceMetrics ?? [];

  const resourceKeys = useMemo(() => {
    const keys = resourceMetrics.map((r) => r.resourceName).filter(Boolean);
    return Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b));
  }, [resourceMetrics]);

  useEffect(() => {
    setVisibleResourceKeys((prev) => {
      if (!resourceSelectionTouched) return resourceKeys;
      const prevSet = new Set(prev);
      return resourceKeys.filter((k) => prevSet.has(k));
    });
  }, [resourceKeys, resourceSelectionTouched]);



  const resourcesChartData = useMemo(() => {
    const byDay = new Map<string, Record<string, number | string>>();
    for (const rm of resourceMetrics) {
      const day = rm.consumedAt;
      const name = rm.resourceName;
      if (!day || !name) continue;
      if (!byDay.has(day)) {
        byDay.set(day, { date: day, _day: day });
      }
      const point = byDay.get(day)!;
      const prev = Number(point[name] ?? 0);
      point[name] = prev + (rm.valuePerKg ?? 0);
    }
    return Array.from(byDay.values()).sort((a, b) => String(a._day).localeCompare(String(b._day)));
  }, [resourceMetrics]);

  const selectedResourceDay =
    selectedResourceDayIndex != null &&
    selectedResourceDayIndex >= 0 &&
    selectedResourceDayIndex < resourcesChartData.length
      ? String((resourcesChartData[selectedResourceDayIndex] as any)._day ?? (resourcesChartData[selectedResourceDayIndex] as any).date)
      : null;

  const selectedDaySummary = useMemo(() => {
    if (!selectedResourceDay) return null;
    const rows = resourceMetrics.filter((r) => r.consumedAt === selectedResourceDay);
    if (rows.length === 0) return null;

    const byName: Record<string, { value: number; valuePerKg: number }> = {};
    let weight = 0;
    for (const r of rows) {
      weight = Math.max(weight, Number(r.weight ?? 0));
      const key = r.resourceName;
      if (!key) continue;
      if (!byName[key]) byName[key] = { value: 0, valuePerKg: 0 };
      byName[key].value += Number(r.value ?? 0);
      byName[key].valuePerKg += Number(r.valuePerKg ?? 0);
    }

    const resources = Object.entries(byName).map(([name, v]) => ({ name, value: v.value }));
    const resourcesPerKg = Object.entries(byName).map(([name, v]) => ({ name, value: v.valuePerKg }));

    resources.sort((a, b) => a.name.localeCompare(b.name));
    resourcesPerKg.sort((a, b) => a.name.localeCompare(b.name));

    return { day: selectedResourceDay, weight, resources, resourcesPerKg };
  }, [selectedResourceDay, resourceMetrics]);

  const orderedSelectedDayPerKg = useMemo(() => {
    if (!selectedDaySummary) return [];
    return sortResourcesByReferenceOrder(
      observed?.resourcesPerKg ?? [],
      selectedDaySummary.resourcesPerKg ?? [],
    );
  }, [selectedDaySummary, observed?.resourcesPerKg]);

  const orderedSelectedDayTotals = useMemo(() => {
    if (!selectedDaySummary) return [];
    return sortResourcesByReferenceOrder(
      observed?.resources ?? [],
      selectedDaySummary.resources ?? [],
    );
  }, [selectedDaySummary, observed?.resources]);

  const handleResourcesChartClick = (state: any) => {
    if (!state || state.activeTooltipIndex == null) return;
    setSelectedResourceDayIndex(state.activeTooltipIndex);
  };

  const weightChartData = useMemo(() => {
    return [...productions]
      .sort((a, b) => String(a.producedAt).localeCompare(String(b.producedAt)))
      .map((p) => ({ date: p.producedAt, weight: p.weight ?? 0 }));
  }, [productions]);

  const ChartComponent = chartType === "bar" ? RechartsBarChart : RechartsLineChart;

  const formatNumber = (value: number, precision: number = 2) =>
    Number(value ?? 0).toLocaleString("pt-BR", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });



  const handleSearch = async () => {
    if (!startDate || !endDate) return;

    setSearchedOnce(true);
    setLoading(true);

    try {
      const start = normalizeDateTimeLocal(startDate);
      const end = normalizeDateTimeLocal(endDate);

      const [metricsResponse, resourcesResponse] = await Promise.all([
        apiJson<LaundryMetricsResponse>(
          "/metrics?start=" + encodeURIComponent(start) + "&end=" + encodeURIComponent(end)
        ),
        apiJson<ResourceMetricsResponse>(
          "/metrics/resources-by-day?start=" + encodeURIComponent(start) + "&end=" + encodeURIComponent(end)
        ),
      ]);

      setData(metricsResponse);
      setResourceData(resourcesResponse);

      const daySet = new Set<string>((resourcesResponse.resourceMetrics ?? []).map((r) => r.consumedAt).filter(Boolean));
      const sortedDays = Array.from(daySet).sort((a, b) => a.localeCompare(b));
      setSelectedResourceDayIndex(sortedDays.length > 0 ? sortedDays.length - 1 : null);
    } catch (error) {
      console.error(error);
      setData(null);
      setResourceData(null);
      setSelectedResourceDayIndex(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void handleSearch();
  }, []);

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="w-5 h-5" />}
        title="Metricas Gerais"
        description="Visualize as metricas gerais do sistema"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start-date" className="text-sm text-gray-600 mb-2 block">
                Data/Hora Inicio
              </Label>
              <input
                id="start-date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                step="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <Label htmlFor="end-date" className="text-sm text-gray-600 mb-2 block">
                Data/Hora Fim
              </Label>
              <input
                id="end-date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                step="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 h-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-2 block">Tipo de Grafico</Label>
            <div className="flex gap-2">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                onClick={() => setChartType("bar")}
                className={chartType === "bar" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Barras
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                onClick={() => setChartType("line")}
                className={chartType === "line" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <LineChartIcon className="w-4 h-4 mr-2" />
                Linhas
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      )}

      {!loading && searchedOnce && !data && (
        <Card className="p-6 bg-white shadow-sm text-center">
          <p className="text-gray-500">Nenhum dado encontrado para o periodo selecionado.</p>
        </Card>
      )}

      {!loading && !searchedOnce && (
        <Card className="p-6 bg-white shadow-sm text-center">
          <p className="text-gray-500">Selecione um periodo e clique em "Buscar" para visualizar os dados.</p>
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-sm">
            <h2 className="text-2xl mb-6 text-gray-800">Peso Total por Dia</h2>

            <ResponsiveContainer width="100%" height={400}>
              <ChartComponent data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 12 }} />
                <YAxis tick={{ fill: "#4B5563", fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatNumber(value, 2)} />
                <Legend />

                {chartType === "bar" ? (
                  <Bar dataKey="weight" name="Peso Total" fill="#6B7280" radius={[4, 4, 0, 0]} />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Peso Total"
                    stroke="#6B7280"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}
              </ChartComponent>
            </ResponsiveContainer>
          </Card>

          {observed && (
            <Card className="p-6 bg-white shadow-sm">
              <h2 className="text-2xl mb-6 text-gray-800">Resumo do Periodo</h2>

              <div className="mb-8">
                <h3 className="text-lg mb-4 text-gray-700">Indicadores por Kg</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {(observed.resourcesPerKg ?? []).map((r) => {
                    const v = resourceVisual(r.name);
                    return (
                      <MetricCard
                        key={`observed-perkg-${r.name}`}
                        label={displayResourceName(r.name)}
                        value={r.value}
                        icon={v.icon}
                        color={v.bg}
                        precision={4}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg mb-4 text-gray-700">Totais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <MetricCard
                    label="Peso Total"
                    value={observed.totalWeight ?? 0}
                    icon={<Weight className="w-6 h-6 text-gray-600" />}
                    color="bg-gray-100"
                  />
                  {(observed.resources ?? []).map((r) => {
                    const v = resourceVisual(r.name);
                    return (
                      <MetricCard
                        key={`observed-total-${r.name}`}
                        label={displayResourceName(r.name)}
                        value={r.value}
                        icon={v.icon}
                        color={v.bg}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
          <Card className="p-6 bg-white shadow-sm">
            <h2 className="text-2xl mb-6 text-gray-800">Recursos por Kg por Dia</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {resourceKeys.map((k) => {
                const active = visibleResourceKeys.includes(k);
                const v = resourceVisual(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setResourceSelectionTouched(true);
                      setVisibleResourceKeys((prev) =>
                        prev.includes(k)
                          ? prev.filter((x) => x !== k)
                          : [...prev, k],
                      );
                    }}
                    className={
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm transition-colors " +
                      (active
                        ? "bg-white text-gray-900 border-gray-300"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100")
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: v.chartColor }}
                    />
                    {displayResourceName(k)}
                  </button>
                );
              })}
            </div>


            {resourcesChartData.length === 0 ? (
              <p className="text-gray-500">Nenhum consumo de recursos encontrado no periodo.</p>
            ) : visibleResourceKeys.length === 0 ? (
              <p className="text-gray-500">Selecione ao menos um recurso para exibir no grafico.</p>
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <ChartComponent data={resourcesChartData} onClick={handleResourcesChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#4B5563", fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatNumber(value, 4)} />
                  <Legend />

                  {chartType === "bar" ? (
                    visibleResourceKeys.map((k) => (
                      <Bar
                        key={k}
                        dataKey={k}
                        name={displayResourceName(k)}
                        fill={resourceVisual(k).chartColor}
                        radius={[4, 4, 0, 0]}
                      />
                    ))
                  ) : (
                    visibleResourceKeys.map((k) => (
                      <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={displayResourceName(k)}
                        stroke={resourceVisual(k).chartColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))
                  )}
                </ChartComponent>
              </ResponsiveContainer>
            )}

            <div className="mt-4 text-sm text-gray-500">Clique nos recursos acima para ocultar/mostrar no grafico. Clique em uma barra/linha para selecionar um dia e ver os indicadores por kg abaixo.</div>
          </Card>

          <Card className="p-6 bg-white shadow-sm">
            <h2 className="text-2xl mb-6 text-gray-800">Indicadores por Kg do Dia Selecionado</h2>

            {!selectedDaySummary ? (
              <p className="text-gray-500">Nenhum dia selecionado.</p>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-6">
                  Dia selecionado: <span className="font-medium text-gray-900">{selectedDaySummary.day}</span>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg mb-4 text-gray-700">Indicadores por Kg</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {orderedSelectedDayPerKg.map((r) => {
                      const v = resourceVisual(r.name);
                      return (
                        <MetricCard
                          key={`day-perkg-${selectedDaySummary.day}-${r.name}`}
                          label={displayResourceName(r.name)}
                          value={r.value}
                          icon={v.icon}
                          color={v.bg}
                          precision={4}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg mb-4 text-gray-700">Totais do Dia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <MetricCard
                      label="Peso Total"
                      value={selectedDaySummary.weight ?? 0}
                      icon={<Weight className="w-6 h-6 text-gray-600" />}
                      color="bg-gray-100"
                    />
                    {orderedSelectedDayTotals.map((r) => {
                      const v = resourceVisual(r.name);
                      return (
                        <MetricCard
                          key={`day-total-${selectedDaySummary.day}-${r.name}`}
                          label={displayResourceName(r.name)}
                          value={r.value}
                          icon={v.icon}
                          color={v.bg}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
