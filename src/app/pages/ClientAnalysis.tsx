import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import {
  Search,
  Loader2,
  Calendar,
  BarChart3,
  LineChart,
  X,
  ChevronDown,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
} from "recharts";
import { apiJson, buildPageParams } from "../lib/api";

interface ClientProduction {
  producedAt: string;
  weight: number;
}

interface ClientAnalysisResponse {
  clientAlias: string;
  clientProductions: ClientProduction[];
}

interface ClientMetricApiModel {
  clientId: number;
  clientAlias: string;
  productions: ClientProduction[];
}

interface ClientSimpleModel {
  id: number;
  alias: string;
  name: string;
}

interface PageResponseClientSimpleModel {
  content: ClientSimpleModel[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

interface ClientOption {
  id: number;
  name: string;
}

async function fetchClientsPage(
  page: number,
  size: number,
): Promise<PageResponseClientSimpleModel> {
  const params = buildPageParams(page, size);
  return apiJson<PageResponseClientSimpleModel>(
    "/clients?" + params.toString(),
  );
}

async function fetchAllClients(): Promise<ClientOption[]> {
  const size = 200;
  const maxPages = 30;
  const all: ClientSimpleModel[] = [];

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchClientsPage(page, size);
    all.push(...(data.content ?? []));
    if (page >= (data.totalPages ?? 0) - 1) break;
  }

  return all.map((c) => ({
    id: c.id,
    name: c.alias || c.name,
  }));
}

interface GroupAnalysisResponse {
  groupName: string;
  clients: {
    clientAlias: string;
    clientProductions: ClientProduction[];
  }[];
}

type ChartType = "bar" | "line";
type ComparisonType = "week" | "month" | null;
type AnalysisType = "compare-clients" | "compare-groups";

const AVAILABLE_GROUPS = [
  { id: 1, name: "Grupo São Paulo - Zona Sul" },
  { id: 2, name: "Grupo São Paulo - Zona Norte" },
  { id: 3, name: "Grupo São Paulo - Zona Leste" },
  { id: 4, name: "Grupo São Paulo - Zona Oeste" },
  { id: 5, name: "Grupo São Paulo - Centro" },
  { id: 6, name: "Grupo Rio de Janeiro - Zona Sul" },
  { id: 7, name: "Grupo Rio de Janeiro - Zona Norte" },
  { id: 8, name: "Grupo Rio de Janeiro - Barra" },
  { id: 9, name: "Grupo Belo Horizonte" },
  { id: 10, name: "Grupo Curitiba" },
  { id: 11, name: "Grupo Porto Alegre" },
  { id: 12, name: "Grupo Brasília" },
  { id: 13, name: "Grupo Salvador" },
  { id: 14, name: "Grupo Fortaleza" },
  { id: 15, name: "Grupo Recife" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTimeLocal(date: Date) {
  return (
    String(date.getFullYear()) +
    "-" +
    pad2(date.getMonth() + 1) +
    "-" +
    pad2(date.getDate()) +
    "T" +
    pad2(date.getHours()) +
    ":" +
    pad2(date.getMinutes())
  );
}

function parseDateTimeLocal(value: string): Date | null {
  const v = value.length === 16 ? value + ":00" : value;
  const m =
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(
      v,
    );
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  const ss = m[6] ? Number(m[6]) : 0;
  return new Date(y, mo - 1, d, hh, mm, ss, 0);
}

function addMonthsClamped(date: Date, deltaMonths: number) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth() + deltaMonths;

  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;

  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);

  return new Date(
    targetYear,
    targetMonth,
    day,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    0,
  );
}

function calculatePreviousPeriod(
  start: string,
  end: string,
  type: ComparisonType,
) {
  if (!type) return { start, end };

  const startDate = parseDateTimeLocal(start);
  const endDate = parseDateTimeLocal(end);
  if (!startDate || !endDate) return { start, end };

  if (type === "week") {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - 7);
    return {
      start: formatDateTimeLocal(newStart),
      end: formatDateTimeLocal(newEnd),
    };
  }

  const newStart = addMonthsClamped(startDate, -1);
  const newEnd = addMonthsClamped(endDate, -1);
  return {
    start: formatDateTimeLocal(newStart),
    end: formatDateTimeLocal(newEnd),
  };
}

function generateMockGroupData(
  groupId: number,
  isPrevious: boolean = false,
): GroupAnalysisResponse {
  const group = AVAILABLE_GROUPS.find((g) => g.id === groupId);
  const weightModifier = isPrevious ? 0.9 : 1;
  const baseWeight = groupId * 20;

  return {
    groupName: group?.name || "Grupo",
    clients: [
      {
        clientAlias: "Hospital A",
        clientProductions: [
          {
            producedAt: "2026-03-01",
            weight: (275.12 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-02",
            weight: (215.32 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-03",
            weight: (266.9 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-04",
            weight: (351.08 + baseWeight) * weightModifier,
          },
        ],
      },
      {
        clientAlias: "Hospital B",
        clientProductions: [
          {
            producedAt: "2026-03-01",
            weight: (189.45 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-02",
            weight: (234.67 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-03",
            weight: (198.23 + baseWeight) * weightModifier,
          },
          {
            producedAt: "2026-03-04",
            weight: (276.89 + baseWeight) * weightModifier,
          },
        ],
      },
    ],
  };
}

interface MultiSelectProps {
  options: { id: number; name: string }[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleRemove = (id: number) => {
    onChange(selected.filter((item) => item !== id));
  };

  const selectedItems = options.filter((opt) => selected.includes(opt.id));

  return (
    <div className="relative">
      <div
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            {selectedItems.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selectedItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                >
                  {item.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    options.length > 0 && selected.length === options.length
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    const allSelected =
                      options.length > 0 && selected.length === options.length;
                    onChange(allSelected ? [] : options.map((o) => o.id));
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span>
                  {selected.length === options.length
                    ? "Desmarcar todos"
                    : "Marcar todos"}
                </span>
              </label>
              <span className="text-xs text-gray-500">
                {options.length} total
              </span>
            </div>
            <div className="overflow-y-auto max-h-64">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum resultado encontrado
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.id)}
                      onChange={() => handleToggle(option.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{option.name}</span>
                  </label>
                ))
              )}
            </div>

            <div className="p-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600">
                {selected.length} selecionado(s)
              </span>
              <div className="flex items-center gap-3">
                {options.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const allSelected = selected.length === options.length;
                      onChange(allSelected ? [] : options.map((o) => o.id));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selected.length === options.length
                      ? "Desmarcar todos"
                      : "Marcar todos"}
                  </button>
                )}
                {selected.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ClientAnalysis() {
  const [analysisType, setAnalysisType] =
    useState<AnalysisType>("compare-clients");
  const [chartType, setChartType] = useState<ChartType>("line");
  const formatLocal = (date: Date) => {
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
  };

  const buildDefaults = () => {
    const now = new Date();

    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 0, 0);

    const start = new Date(end);
    start.setDate(start.getDate() - 14);
    start.setHours(0, 0, 0, 0);

    return {
      startDate: formatLocal(start),
      endDate: formatLocal(end),
    };
  };

  const defaults = buildDefaults();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([1, 2]);
  const [loading, setLoading] = useState(false);
  const [clientsData, setClientsData] = useState<ClientAnalysisResponse[]>([]);
  const [groupsData, setGroupsData] = useState<GroupAnalysisResponse[]>([]);
  const [comparison, setComparison] = useState<ComparisonType>(null);
  const [previousClientsData, setPreviousClientsData] = useState<ClientAnalysisResponse[]>([]);
  const [previousGroupsData, setPreviousGroupsData] = useState<GroupAnalysisResponse[]>([]);

  const [availableClients, setAvailableClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [didInitialSearch, setDidInitialSearch] = useState(false);

  const normalizeDateTimeLocal = (value: string) =>
    value.length === 16 ? value + ":00" : value;

  const periodDays = useMemo(() => {
    const s = parseDateTimeLocal(startDate);
    const e = parseDateTimeLocal(endDate);
    if (!s || !e) return 0;

    const startDay = new Date(
      s.getFullYear(),
      s.getMonth(),
      s.getDate(),
      0,
      0,
      0,
      0,
    );
    const endDay = new Date(
      e.getFullYear(),
      e.getMonth(),
      e.getDate(),
      0,
      0,
      0,
      0,
    );
    const diffDays = Math.round(
      (endDay.getTime() - startDay.getTime()) / 86400000,
    );
    return diffDays >= 0 ? diffDays + 1 : 0;
  }, [startDate, endDate]);

  const showWeekCompare = periodDays > 0 && periodDays <= 7;

  const showMonthCompare = useMemo(() => {
    const s = parseDateTimeLocal(startDate);
    const e = parseDateTimeLocal(endDate);
    if (!s || !e) return false;
    return s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  }, [startDate, endDate]);

  useEffect(() => {
    if (
      (comparison === "week" && !showWeekCompare) ||
      (comparison === "month" && !showMonthCompare)
    ) {
      setComparison(null);
      setPreviousClientsData([]);
      setPreviousGroupsData([]);
    }
  }, [comparison, showWeekCompare, showMonthCompare]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setClientsLoading(true);
      setClientsError(null);
      try {
        const options = await fetchAllClients();
        if (cancelled) return;
        setAvailableClients(options);
        const allIds = options.map((o) => o.id);
        setSelectedClients((prev) => (prev.length > 0 ? prev : allIds));
        if (
          !didInitialSearch &&
          analysisType === "compare-clients" &&
          allIds.length > 0
        ) {
          setDidInitialSearch(true);
          void runSearch(allIds);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setAvailableClients([]);
          setClientsError("Erro ao carregar clientes");
        }
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async (clientIdsOverride?: number[]) => {
    const clientIdsToUse = clientIdsOverride ?? selectedClients;

    const hasSelection =
      analysisType === "compare-clients"
        ? clientIdsToUse.length > 0
        : selectedGroups.length > 0;

    if (!hasSelection) {
      alert(
        "Selecione pelo menos " +
          (analysisType === "compare-clients" ? "um cliente" : "um grupo"),
      );
      return;
    }

    setLoading(true);
    setComparison(null);
    setPreviousClientsData([]);
    setPreviousGroupsData([]);

    try {
      if (analysisType === "compare-clients") {
        const params = new URLSearchParams();
        params.set("start", normalizeDateTimeLocal(startDate));
        params.set("end", normalizeDateTimeLocal(endDate));
        params.set("clientIds", clientIdsToUse.join(","));

        const raw = await apiJson<unknown>(
          "/metrics/clients?" + params.toString(),
        );
        const list: ClientMetricApiModel[] = Array.isArray(raw)
          ? (raw as ClientMetricApiModel[])
          : ((raw as any)?.clients ?? []);

        const mapped: ClientAnalysisResponse[] = list.map((c) => ({
          clientAlias: c.clientAlias,
          clientProductions: c.productions ?? [],
        }));

        setClientsData(mapped);
        setGroupsData([]);
      } else {
        // Mantem comportamento atual (mock) para grupos
        await new Promise((resolve) => setTimeout(resolve, 800));
        const data = selectedGroups.map((id) => generateMockGroupData(id));
        setGroupsData(data);
        setClientsData([]);
      }
    } catch (error) {
      console.error(error);
      if (analysisType === "compare-clients") {
        setClientsData([]);
      } else {
        setGroupsData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    void runSearch();
  };

  const handleComparison = async (type: ComparisonType) => {
    if (!type) return;

    setLoading(true);
    setComparison(type);

    try {
      const prev = calculatePreviousPeriod(startDate, endDate, type);

      if (analysisType === "compare-clients") {
        const params = new URLSearchParams();
        params.set("start", normalizeDateTimeLocal(prev.start));
        params.set("end", normalizeDateTimeLocal(prev.end));
        params.set("clientIds", selectedClients.join(","));

        const raw = await apiJson<unknown>(
          "/metrics/clients?" + params.toString(),
        );
        const list: ClientMetricApiModel[] = Array.isArray(raw)
          ? (raw as ClientMetricApiModel[])
          : ((raw as any)?.clients ?? []);

        const mapped: ClientAnalysisResponse[] = list.map((c) => ({
          clientAlias: c.clientAlias,
          clientProductions: c.productions ?? [],
        }));

        setPreviousClientsData(mapped);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const data = selectedGroups.map((id) =>
          generateMockGroupData(id, true),
        );
        setPreviousGroupsData(data);
      }
    } catch (error) {
      console.error(error);
      if (analysisType === "compare-clients") {
        setPreviousClientsData([]);
      } else {
        setPreviousGroupsData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const extractYmd = (value: string) => {
    const m = /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(value);
    return m ? m[1] : null;
  };

  const ymdToPtBr = (ymd: string) => {
    return ymd.slice(8, 10) + "/" + ymd.slice(5, 7) + "/" + ymd.slice(0, 4);
  };

  const prepareClientsChartData = (data: ClientAnalysisResponse[]) => {
    if (!data || data.length === 0) return [];

    const dateMap = new Map<string, any>();

    data.forEach((client) => {
      client.clientProductions.forEach((prod) => {
        const ymd = extractYmd(prod.producedAt);
        if (!ymd) return;

        if (!dateMap.has(ymd)) {
          dateMap.set(ymd, { date: ymdToPtBr(ymd), _ymd: ymd });
        }

        const entry = dateMap.get(ymd);
        entry[client.clientAlias] = prod.weight;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      (a._ymd || "").localeCompare(b._ymd || ""),
    );
  };

  const prepareGroupsChartData = (data: GroupAnalysisResponse[]) => {
    if (!data || data.length === 0) return [];

    const dateMap = new Map<string, any>();

    data.forEach((group) => {
      const groupTotals = new Map<string, number>();

      group.clients.forEach((client) => {
        client.clientProductions.forEach((prod) => {
          const ymd = extractYmd(prod.producedAt);
          if (!ymd) return;
          const currentTotal = groupTotals.get(ymd) || 0;
          groupTotals.set(ymd, currentTotal + prod.weight);
        });
      });

      groupTotals.forEach((total, ymd) => {
        if (!dateMap.has(ymd)) {
          dateMap.set(ymd, { date: ymdToPtBr(ymd), _ymd: ymd });
        }

        const entry = dateMap.get(ymd);
        entry[group.groupName] = total;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      (a._ymd || "").localeCompare(b._ymd || ""),
    );
  };

  const currentChartData =
    analysisType === "compare-clients"
      ? prepareClientsChartData(clientsData)
      : prepareGroupsChartData(groupsData);

  const previousChartData =
    analysisType === "compare-clients"
      ? prepareClientsChartData(previousClientsData)
      : prepareGroupsChartData(previousGroupsData);

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
  ];

  const renderChart = (data: any[], entities: string[], title: string) => {
    const ChartComponent =
      chartType === "bar" ? RechartsBarChart : RechartsLineChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#4B5563", fontSize: 12 }}
            label={{ value: "Peso (kg)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />

          {chartType === "bar"
            ? entities.map((entity, index) => (
                <Bar
                  key={entity}
                  dataKey={entity}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))
            : entities.map((entity, index) => (
                <Line
                  key={entity}
                  type="monotone"
                  dataKey={entity}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const getCurrentEntities = () => {
    if (analysisType === "compare-clients") {
      return clientsData.map((c) => c.clientAlias);
    } else {
      return groupsData.map((g) => g.groupName);
    }
  };

  const calculateTotals = (data: any[]) => {
    const entities = getCurrentEntities();
    const totals: { [key: string]: number } = {};

    entities.forEach((entity) => {
      totals[entity] = data.reduce((sum, day) => sum + (day[entity] || 0), 0);
    });

    return totals;
  };

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="w-5 h-5" />}
        title="Análise de Clientes"
        description="Compare a produção de múltiplos clientes ou grupos"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">
              Tipo de Análise
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="analysisType"
                  value="compare-clients"
                  checked={analysisType === "compare-clients"}
                  onChange={(e) =>
                    setAnalysisType(e.target.value as AnalysisType)
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Comparar Clientes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="analysisType"
                  value="compare-groups"
                  checked={analysisType === "compare-groups"}
                  onChange={(e) =>
                    setAnalysisType(e.target.value as AnalysisType)
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Comparar Grupos</span>
              </label>
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-2 block">
              Tipo de Gráfico
            </Label>
            <div className="flex gap-2">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                onClick={() => setChartType("bar")}
                className={
                  chartType === "bar" ? "bg-blue-600 hover:bg-blue-700" : ""
                }
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Barras
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                onClick={() => setChartType("line")}
                className={
                  chartType === "line" ? "bg-blue-600 hover:bg-blue-700" : ""
                }
              >
                <LineChart className="w-4 h-4 mr-2" />
                Linhas
              </Button>
            </div>
          </div>

          {analysisType === "compare-clients" ? (
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">
                Selecione os Clientes
              </Label>
              <MultiSelect
                options={availableClients}
                selected={selectedClients}
                onChange={setSelectedClients}
                placeholder={
                  clientsLoading
                    ? "Carregando clientes..."
                    : clientsError
                      ? clientsError
                      : "Selecione um ou mais clientes..."
                }
              />
            </div>
          ) : (
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">
                Selecione os Grupos
              </Label>
              <MultiSelect
                options={AVAILABLE_GROUPS}
                selected={selectedGroups}
                onChange={setSelectedGroups}
                placeholder="Selecione um ou mais grupos..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label
                htmlFor="start-date"
                className="text-sm text-gray-600 mb-2 block"
              >
                Data/Hora Início
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
              <Label
                htmlFor="end-date"
                className="text-sm text-gray-600 mb-2 block"
              >
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
              <Search className="w-5 h-5 mr-2" />
              Buscar
            </Button>
          </div>

          {(clientsData.length > 0 || groupsData.length > 0) &&
            (showWeekCompare || showMonthCompare) && (
              <div className="pt-4 border-t border-gray-200">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Comparar com Período Anterior
                </Label>
                <div className="flex gap-2">
                  {showWeekCompare && (
                    <Button
                      variant="outline"
                      onClick={() => handleComparison("week")}
                      disabled={loading}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Semana Passada
                    </Button>
                  )}
                  {showMonthCompare && (
                    <Button
                      variant="outline"
                      onClick={() => handleComparison("month")}
                      disabled={loading}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Mês Passado
                    </Button>
                  )}
                </div>
              </div>
            )}
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      )}

      {!loading && currentChartData.length > 0 && (
        <div className="space-y-6">
          <Card className="p-6 bg-white shadow-sm">
            <h2 className="text-2xl mb-6 text-gray-800">
              {analysisType === "compare-clients"
                ? "Comparação de Clientes"
                : "Comparação de Grupos"}
              {comparison && (
                <span className="text-base text-gray-500 ml-2">
                  (Período Atual)
                </span>
              )}
            </h2>

            {renderChart(
              currentChartData,
              getCurrentEntities(),
              "Período Atual",
            )}

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getCurrentEntities().map((entity, index) => {
                const totals = calculateTotals(currentChartData);
                const total = totals[entity] || 0;
                const avg = total / currentChartData.length;

                return (
                  <div
                    key={entity}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: `${colors[index % colors.length]}15`,
                    }}
                  >
                    <p
                      className="text-sm text-gray-600 mb-1 truncate"
                      title={entity}
                    >
                      {entity}
                    </p>
                    <p className="text-xl text-gray-900 mb-1">
                      {total.toFixed(2)} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      Média: {avg.toFixed(2)} kg/dia
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {previousChartData.length > 0 && comparison && (
            <Card className="p-6 bg-white shadow-sm">
              <h2 className="text-2xl mb-6 text-gray-800">
                {analysisType === "compare-clients"
                  ? "Comparação de Clientes"
                  : "Comparação de Grupos"}
                <span className="text-base text-gray-500 ml-2">
                  ({comparison === "week" ? "Semana Passada" : "Mês Passado"})
                </span>
              </h2>

              {renderChart(
                previousChartData,
                getCurrentEntities(),
                "Período Anterior",
              )}

              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getCurrentEntities().map((entity, index) => {
                  const totals = calculateTotals(previousChartData);
                  const total = totals[entity] || 0;
                  const avg = total / previousChartData.length;

                  return (
                    <div
                      key={entity}
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: `${colors[index % colors.length]}15`,
                      }}
                    >
                      <p
                        className="text-sm text-gray-600 mb-1 truncate"
                        title={entity}
                      >
                        {entity}
                      </p>
                      <p className="text-xl text-gray-900 mb-1">
                        {total.toFixed(2)} kg
                      </p>
                      <p className="text-xs text-gray-500">
                        Média: {avg.toFixed(2)} kg/dia
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Variação por Entidade
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getCurrentEntities().map((entity) => {
                    const currentTotals = calculateTotals(currentChartData);
                    const previousTotals = calculateTotals(previousChartData);
                    const variation = previousTotals[entity]
                      ? (
                          ((currentTotals[entity] - previousTotals[entity]) /
                            previousTotals[entity]) *
                          100
                        ).toFixed(1)
                      : "0.0";
                    const isPositive = parseFloat(variation) >= 0;

                    return (
                      <div key={entity} className="text-center">
                        <p
                          className="text-xs text-gray-600 mb-1 truncate"
                          title={entity}
                        >
                          {entity}
                        </p>
                        <p
                          className={`text-lg ${isPositive ? "text-green-600" : "text-red-600"}`}
                        >
                          {isPositive ? "+" : ""}
                          {variation}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {!loading && currentChartData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-lg">
            Selecione os filtros e clique em "Buscar" para visualizar a análise
          </p>
        </div>
      )}
    </div>
  );
}
