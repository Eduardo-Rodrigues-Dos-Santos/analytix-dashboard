import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import { DraggableModal } from "../components/DraggableModal";
import { Edit2, Loader2, Plus, Save, Search, Target, Trash2 } from "lucide-react";
import { apiJson, apiRequest } from "../lib/api";
import { formatApiNumber, formatFixedNumber, parseApiNumber } from "../lib/format";

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

interface GoalFormData {
  tagId: number;
  value: number;
}

async function fetchResources(): Promise<TagModel[]> {
  return apiJson<TagModel[]>("/resources");
}

async function fetchGoals(): Promise<GoalModel[]> {
  return apiJson<GoalModel[]>("/goals");
}

async function createGoal(data: GoalFormData): Promise<GoalModel> {
  return apiJson<GoalModel>("/goals", {
    method: "POST",
    body: JSON.stringify({ tagId: data.tagId, value: data.value }),
  });
}

async function updateGoal(goalId: number, data: GoalFormData): Promise<GoalModel> {
  return apiJson<GoalModel>(`/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify({ tagId: data.tagId, value: data.value }),
  });
}

async function deleteGoal(goalId: number): Promise<void> {
  await apiRequest(`/goals/${goalId}`, { method: "DELETE" });
}

export function Goals() {
  const [resources, setResources] = useState<TagModel[]>([]);
  const [goals, setGoals] = useState<GoalModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalModel | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<GoalFormData>({ tagId: 0, value: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [res, gs] = await Promise.all([fetchResources(), fetchGoals()]);
      setResources(res);
      setGoals(gs);
    } catch (error) {
      console.error("Error loading goals/resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resourcesById = useMemo(() => {
    const map = new Map<number, TagModel>();
    for (const r of resources) map.set(r.id, r);
    return map;
  }, [resources]);

  const selectedResource = useMemo(() => {
    if (formData.tagId) return resourcesById.get(formData.tagId) ?? null;
    if (editingGoal?.tag?.id) return editingGoal.tag;
    return null;
  }, [editingGoal, formData.tagId, resourcesById]);

  const goalTagIds = useMemo(() => {
    const set = new Set<number>();
    for (const g of goals) {
      const id = g.tag?.id;
      if (typeof id === "number") set.add(id);
    }
    return set;
  }, [goals]);

  const filteredGoals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return goals
      .filter((g) => {
        if (!term) return true;
        const name = String(g.tag?.name ?? "").toLowerCase();
        const value = String(g.tag?.value ?? "").toLowerCase();
        return name.includes(term) || value.includes(term);
      })
      .sort((a, b) =>
        String(a.tag?.name ?? "").localeCompare(String(b.tag?.name ?? ""), "pt-BR"),
      );
  }, [goals, searchTerm]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tagId || formData.tagId <= 0) {
      errors.tagId = "Recurso (tag) e obrigatorio";
    } else {
      const existing = goals.find((g) => g.tag?.id === formData.tagId && g.id !== (editingGoal?.id ?? -1));
      if (existing) errors.tagId = "Ja existe uma meta cadastrada para este recurso";
    }

    if (formData.value === null || formData.value === undefined || Number.isNaN(formData.value)) {
      errors.value = "Meta e obrigatoria";
    } else if (formData.value < 0) {
      errors.value = "Meta nao pode ser negativa";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (goal?: GoalModel) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({ tagId: goal.tag.id, value: parseApiNumber(goal.value) });
    } else {
      setEditingGoal(null);
      setFormData({ tagId: 0, value: 0 });
    }
    setFormErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setFormData({ tagId: 0, value: 0 });
    setFormErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, formData);
      } else {
        await createGoal(formData);
      }
      handleCloseModal();
      await loadAll();
    } catch (error) {
      console.error("Error saving goal:", error);
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (goalId: number) => {
    setGoalToDelete(goalId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGoalToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    setLoading(true);
    try {
      await deleteGoal(goalToDelete);
      handleCloseDeleteModal();
      await loadAll();
    } catch (error) {
      console.error("Error deleting goal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Target />}
        title="Cadastro de Metas"
        description="Defina metas de consumo (por tag de telemetria)"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm text-gray-600 mb-2 block">
              Buscar Meta
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do recurso ou a tag..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Meta
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-gray-800">Lista de Metas</h2>
          <span className="text-sm text-gray-600">Total: {goals.length} meta(s)</span>
        </div>

        {loading && !isModalOpen && !isDeleteModalOpen ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-gray-600">Recurso</th>
                    <th className="text-left py-3 px-4 text-gray-600">Tag</th>
                    <th className="text-left py-3 px-4 text-gray-600">Meta</th>
                    <th className="text-right py-3 px-4 text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhuma meta encontrada" : "Nenhuma meta cadastrada"}
                      </td>
                    </tr>
                  ) : (
                    filteredGoals.map((goal) => (
                      <tr key={goal.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{goal.id}</td>
                        <td className="py-3 px-4 text-gray-900">{goal.tag?.name ?? "-"}</td>
                        <td className="py-3 px-4 text-gray-700">{goal.tag?.value ?? "-"}</td>
                        <td className="py-3 px-4 text-gray-700">{typeof goal.value === "string" ? goal.value : formatFixedNumber(goal.value, 4)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(goal)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(goal.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <DraggableModal
        isOpen={isModalOpen}
        title={editingGoal ? "Editar Meta" : "Nova Meta"}
        onClose={handleCloseModal}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <div>
            <Label htmlFor="tagId" className="text-sm text-gray-600 mb-2 block">
              Recurso (Tag) *
            </Label>
            <select
              id="tagId"
              value={formData.tagId || ""}
              onChange={(e) => setFormData({ ...formData, tagId: parseInt(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.tagId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Selecione um recurso...</option>
              {resources
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((r) => {
                  const disabled = goalTagIds.has(r.id) && r.id !== (editingGoal?.tag?.id ?? -1);
                  return (
                    <option key={r.id} value={r.id} disabled={disabled}>
                      {r.name}{disabled ? " (ja possui meta)" : ""}
                    </option>
                  );
                })}
            </select>
            {formErrors.tagId && <p className="text-red-500 text-sm mt-1">{formErrors.tagId}</p>}

            {selectedResource && (
              <p className="text-xs text-gray-500 mt-2">
                Tag selecionada: <span className="font-medium">{selectedResource.value}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="value" className="text-sm text-gray-600 mb-2 block">
              Meta *
            </Label>
            <input
              id="value"
              type="number"
              step="0.0001"
              value={Number.isFinite(formData.value) ? formData.value : ""}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.value ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: 3.9080"
            />
            {formErrors.value && <p className="text-red-500 text-sm mt-1">{formErrors.value}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingGoal ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DraggableModal>

      <DraggableModal
        isOpen={isDeleteModalOpen}
        title="Confirmar Exclusao"
        onClose={handleCloseDeleteModal}
        maxWidth="md"
      >
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja excluir esta meta? Esta acao nao pode ser desfeita.
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseDeleteModal}
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </div>
      </DraggableModal>
    </div>
  );
}
