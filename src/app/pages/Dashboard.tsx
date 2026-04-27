import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/PageHeader";
import { apiJson } from "../lib/api";
import { displayApiDecimal, parseApiNumber } from "../lib/format";
import { Activity, Droplets, Flame, Loader2, Recycle, TrendingUp, Zap } from "lucide-react";

interface TagModel {
  id: number;
  name: string;
  value: string;
}

interface GoalModel {
  id: number;
  value: number | string;
  tag: TagModel;
}

interface ResourceGoalMetric {
  name: string;
  perKgOfWeek: number | string;
  perKgOfMonth: number | string;
  perKgOfYear: number | string;
}

interface ResourceGoal {
  resourceId: string;
  consumptionGoalRaw: number | string;
  consumptionWeekRaw: number | string;
  consumptionMonthRaw: number | string;
  consumptionYearRaw: number | string;
}

interface ResourceGoalWithPercentages extends ResourceGoal {
  weekDiff: number;
  monthDiff: number;
  yearDiff: number;
}


function calculatePercentageDiff(actual: number, goal: number): number {
  if (goal === 0) return 0;
  return ((actual - goal) / goal) * 100;
}

function processGoals(goals: ResourceGoal[]): ResourceGoalWithPercentages[] {
  return goals.map((goal) => {
    const goalValue = parseApiNumber(goal.consumptionGoalRaw);
    const week = parseApiNumber(goal.consumptionWeekRaw);
    const month = parseApiNumber(goal.consumptionMonthRaw);
    const year = parseApiNumber(goal.consumptionYearRaw);

    return {
      ...goal,
      weekDiff: calculatePercentageDiff(week, goalValue),
      monthDiff: calculatePercentageDiff(month, goalValue),
      yearDiff: calculatePercentageDiff(year, goalValue),
    };
  });
}

async function fetchDashboardMetrics(): Promise<ResourceGoalMetric[]> {
  return apiJson<ResourceGoalMetric[]>("/goals/dashboard");
}

async function fetchGoals(): Promise<GoalModel[]> {
  return apiJson<GoalModel[]>("/goals");
}

function normalizeKey(value: string) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<ResourceGoalWithPercentages[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [metrics, goalList] = await Promise.all([
          fetchDashboardMetrics(),
          fetchGoals(),
        ]);

        const goalByKey = new Map<string, number | string>();

        for (const g of goalList) {
          const tagName = g?.tag?.name ? String(g.tag.name) : "";
          const tagValue = g?.tag?.value ? String(g.tag.value) : "";

          if (tagName) goalByKey.set(normalizeKey(tagName), g.value);
          if (tagValue) goalByKey.set(normalizeKey(tagValue), g.value);
        }

        const merged: ResourceGoal[] = (metrics ?? [])
          .map((m) => {
            const k = normalizeKey(m.name);
            return {
              resourceId: m.name,
              consumptionGoalRaw: goalByKey.get(k) ?? 0,
              consumptionWeekRaw: m.perKgOfWeek ?? 0,
              consumptionMonthRaw: m.perKgOfMonth ?? 0,
              consumptionYearRaw: m.perKgOfYear ?? 0,
            };
          })
          .sort((a, b) => a.resourceId.localeCompare(b.resourceId, "pt-BR"));

        setGoals(processGoals(merged));
      } catch (e) {
        console.error("Error loading dashboard:", e);
        setGoals([]);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getResourceIcon = (resourceId: string) => {
    const key = normalizeKey(resourceId);
    const icons: { [key: string]: React.ReactNode } = {
      energia: <Zap className="w-6 h-6 text-blue-600" />,
      "agua nova": <Droplets className="w-6 h-6 text-blue-600" />,
      "agua reuso": <Recycle className="w-6 h-6 text-blue-600" />,
      vapor: <Flame className="w-6 h-6 text-blue-600" />,
    };
    return icons[key] || <Activity className="w-6 h-6 text-blue-600" />;
  };

  return (
    <div>
      <PageHeader
        icon={<TrendingUp className="w-5 h-5" />}
        title="Dashboard Lavanderia"
        description="Visao geral do sistema"
      />

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 mb-6">
          {error}
        </Card>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-lg">Carregando metas...</p>
        </div>
      )}

      <Card className="p-6 bg-white shadow-sm">
        {!loading && goals.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl text-gray-900">Metas de Consumo por Kg</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {goals.map((goal) => (
                <Card
                  key={goal.resourceId}
                  className="p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                    {getResourceIcon(goal.resourceId)}
                    <div className="flex-1">
                      <h4 className="text-lg text-gray-900">{goal.resourceId}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">Meta:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {displayApiDecimal(goal.consumptionGoalRaw, 4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Semana</span>
                        <span className="text-sm font-bold text-gray-900">
                          {displayApiDecimal(goal.consumptionWeekRaw, 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {goal.weekDiff > 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              goal.weekDiff > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {goal.weekDiff > 0 ? "+" : ""}
                            {goal.weekDiff.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {goal.weekDiff > 0 ? "acima" : "abaixo"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Mês</span>
                        <span className="text-sm font-bold text-gray-900">
                          {displayApiDecimal(goal.consumptionMonthRaw, 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {goal.monthDiff > 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              goal.monthDiff > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {goal.monthDiff > 0 ? "+" : ""}
                            {goal.monthDiff.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {goal.monthDiff > 0 ? "acima" : "abaixo"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Ano</span>
                        <span className="text-sm font-bold text-gray-900">
                          {displayApiDecimal(goal.consumptionYearRaw, 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {goal.yearDiff > 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              goal.yearDiff > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {goal.yearDiff > 0 ? "+" : ""}
                            {goal.yearDiff.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {goal.yearDiff > 0 ? "acima" : "abaixo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-3 bg-gray-50">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />
                  <span className="text-gray-700">Abaixo da meta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span className="text-gray-700">Acima da meta</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Activity className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">Nenhuma meta disponível no momento</p>
          </div>
        )}
      </Card>
    </div>
  );
}
