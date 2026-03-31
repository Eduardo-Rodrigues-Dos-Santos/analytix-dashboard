import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import { DraggableModal } from "../components/DraggableModal";
import {
  Edit2,
  Loader2,
  Plus,
  Radio,
  Save,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { apiJson, apiRequest, buildPageParams } from "../lib/api";

interface KeeperTag {
  id: number;
  name: string;
  value: string;
}

interface Keeper {
  id: number;
  name: string;
  reference: string;
  tags: KeeperTag[];
}

interface KeeperListItem {
  id: number;
  name: string;
}

interface KeeperListResponse {
  content: KeeperListItem[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

interface KeeperFormData {
  name: string;
  reference: string;
}

interface KeeperModel {
  id: number;
  reference: string;
  name: string;
  tags?: KeeperTag[];
}

interface PageResponseKeeperSimpleModel {
  content: { id: number; name: string }[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

function mapKeeperModel(model: KeeperModel): Keeper {
  return {
    id: model.id,
    name: model.name,
    reference: model.reference,
    tags: (model.tags ?? []).filter((t) => Boolean(t && t.name)),
  };
}

async function fetchKeepers(page = 0, size = 10, sort: string[] = []): Promise<KeeperListResponse> {
  const params = buildPageParams(page, size, sort);
  const data = await apiJson<PageResponseKeeperSimpleModel>(`/keepers?${params.toString()}`);
  return {
    content: data.content,
    pageNumber: data.pageNumber,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  };
}

async function fetchKeeperById(keeperId: number): Promise<Keeper> {
  const model = await apiJson<KeeperModel>(`/keepers/${keeperId}`);
  return mapKeeperModel(model);
}

async function createKeeper(data: KeeperFormData): Promise<void> {
  await apiRequest("/keepers", {
    method: "POST",
    body: JSON.stringify({ name: data.name, reference: data.reference }),
  });
}

async function updateKeeper(keeperId: number, data: KeeperFormData): Promise<Keeper> {
  const model = await apiJson<KeeperModel>(`/keepers/${keeperId}`, {
    method: "PUT",
    body: JSON.stringify({ name: data.name, reference: data.reference }),
  });
  return mapKeeperModel(model);
}

async function deleteKeeper(keeperId: number): Promise<void> {
  await apiRequest(`/keepers/${keeperId}`, { method: "DELETE" });
}

async function addTag(keeperId: number, name: string, value: string): Promise<void> {
  await apiRequest(`/keepers/${keeperId}/add-tag`, {
    method: "PUT",
    body: JSON.stringify({ name, value }),
  });
}

async function removeTag(keeperId: number, tagId: number): Promise<void> {
  const params = new URLSearchParams();
  params.set("tagId", String(tagId));
  await apiRequest(`/keepers/${keeperId}/remove-tag?${params.toString()}`, {
    method: "PUT",
  });
}

export function Keepers() {
  const [keepers, setKeepers] = useState<KeeperListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingKeeper, setEditingKeeper] = useState<Keeper | null>(null);
  const [keeperToDelete, setKeeperToDelete] = useState<number | null>(null);
  const [managingTagsKeeper, setManagingTagsKeeper] = useState<Keeper | null>(null);

  const [formData, setFormData] = useState<KeeperFormData>({
    name: "",
    reference: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [tagName, setTagName] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [tagError, setTagError] = useState("");

  const loadKeepers = async () => {
    setLoading(true);
    try {
      const response = await fetchKeepers(page, pageSize);
      setKeepers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error loading keepers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeepers();
  }, [page]);

  const filteredKeepers = keepers.filter((keeper) =>
    keeper.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Nome e obrigatorio";
    }

    if (!formData.reference.trim()) {
      errors.reference = "Referencia e obrigatoria";
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.reference)) {
        errors.reference = "Referencia deve ser um UUID valido";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = async (keeper?: KeeperListItem) => {
    if (keeper) {
      setLoading(true);
      try {
        const fullKeeper = await fetchKeeperById(keeper.id);
        setEditingKeeper(fullKeeper);
        setFormData({
          name: fullKeeper.name,
          reference: fullKeeper.reference ?? "",
        });
      } catch (error) {
        console.error("Error loading keeper:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setEditingKeeper(null);
      setFormData({ name: "", reference: "" });
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKeeper(null);
    setFormData({ name: "", reference: "" });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingKeeper) {
        await updateKeeper(editingKeeper.id, formData);
      } else {
        await createKeeper(formData);
      }
      handleCloseModal();
      loadKeepers();
    } catch (error) {
      console.error("Error saving keeper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (keeperId: number) => {
    setKeeperToDelete(keeperId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setKeeperToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!keeperToDelete) return;

    setLoading(true);
    try {
      await deleteKeeper(keeperToDelete);
      handleCloseDeleteModal();
      loadKeepers();
    } catch (error) {
      console.error("Error deleting keeper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTagsModal = async (keeper: KeeperListItem) => {
    setLoading(true);
    try {
      const fullKeeper = await fetchKeeperById(keeper.id);
      setManagingTagsKeeper(fullKeeper);
      setIsTagModalOpen(true);
    } catch (error) {
      console.error("Error loading keeper:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTagsModal = () => {
    setIsTagModalOpen(false);
    setManagingTagsKeeper(null);
    setTagName("");
    setTagValue("");
    setTagError("");
  };

  const handleAddTag = async () => {
    if (!managingTagsKeeper) return;

    if (!tagName.trim() || !tagValue.trim()) {
      setTagError("Nome e valor da tag sao obrigatorios");
      return;
    }

    setLoading(true);
    setTagError("");
    try {
      await addTag(managingTagsKeeper.id, tagName, tagValue);
      const updatedKeeper = await fetchKeeperById(managingTagsKeeper.id);
      setManagingTagsKeeper(updatedKeeper);
      setTagName("");
      setTagValue("");
    } catch (error) {
      console.error("Error adding tag:", error);
      setTagError("Erro ao adicionar tag");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!managingTagsKeeper) return;

    setLoading(true);
    try {
      await removeTag(managingTagsKeeper.id, tagId);
      const updatedKeeper = await fetchKeeperById(managingTagsKeeper.id);
      setManagingTagsKeeper(updatedKeeper);
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Radio className="w-5 h-5" />}
        title="Cadastro de Keepers"
        description="Gerencie os equipamentos de telemetria"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm text-gray-600 mb-2 block">
              Buscar Keeper
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do keeper..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Keeper
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-gray-800">Lista de Keepers</h2>
          <span className="text-sm text-gray-600">Total: {totalElements} keeper(s)</span>
        </div>

        {loading && !isModalOpen && !isDeleteModalOpen && !isTagModalOpen ? (
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
                    <th className="text-left py-3 px-4 text-gray-600">Nome</th>
                    <th className="text-right py-3 px-4 text-gray-600">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredKeepers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhum keeper encontrado" : "Nenhum keeper cadastrado"}
                      </td>
                    </tr>
                  ) : (
                    filteredKeepers.map((keeper) => (
                      <tr key={keeper.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{keeper.id}</td>
                        <td className="py-3 px-4 text-gray-900">{keeper.name}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(keeper)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(keeper.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenTagsModal(keeper)}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              <Tag className="w-4 h-4 mr-1" />
                              Tags
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Pagina {page + 1} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <DraggableModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingKeeper ? "Editar Keeper" : "Novo Keeper"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm text-gray-600 mb-2 block">
              Nome *
            </Label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Keeper Caldeira A"
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="reference" className="text-sm text-gray-600 mb-2 block">
              Referencia (UUID) *
            </Label>
            <input
              id="reference"
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.reference ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            />
            {formErrors.reference && (
              <p className="text-red-500 text-sm mt-1">{formErrors.reference}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</p>
          </div>

          {editingKeeper && editingKeeper.tags && editingKeeper.tags.length > 0 && (
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Tags</Label>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">ID</th>
                      <th className="text-left font-medium px-3 py-2">Nome</th>
                      <th className="text-left font-medium px-3 py-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingKeeper.tags.map((tag) => (
                      <tr key={tag.id} className="border-t border-gray-200">
                        <td className="px-3 py-2 text-gray-700">{tag.id}</td>
                        <td className="px-3 py-2 text-gray-900 font-medium">{tag.name}</td>
                        <td className="px-3 py-2 text-blue-700">{tag.value || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Para adicionar ou remover tags, use o botao \"Tags\" na lista.</p>
            </div>
          )}

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
                  {editingKeeper ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DraggableModal>

      <DraggableModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirmar Exclusao"
        maxWidth="md"
      >
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja excluir este keeper? Esta acao nao pode ser desfeita.
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

      <DraggableModal
        isOpen={isTagModalOpen}
        onClose={handleCloseTagsModal}
        title={`Gerenciar Tags - ${managingTagsKeeper?.name || ""}`}
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4">Adicionar Nova Tag</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tagName" className="text-sm text-gray-600 mb-2 block">
                  Nome da Tag *
                </Label>
                <input
                  id="tagName"
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tagError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: temperatura"
                />
              </div>

              <div>
                <Label htmlFor="tagValue" className="text-sm text-gray-600 mb-2 block">
                  Valor da Tag *
                </Label>
                <input
                  id="tagValue"
                  type="text"
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tagError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: 100"
                />
              </div>
            </div>

            {tagError && <p className="text-red-500 text-sm mt-2">{tagError}</p>}

            <Button
              type="button"
              onClick={handleAddTag}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Tag
                </>
              )}
            </Button>
          </div>

          {managingTagsKeeper && managingTagsKeeper.tags && managingTagsKeeper.tags.length > 0 && (
            <div>
              <h3 className="text-lg text-gray-900 mb-4">Tags Atuais</h3>
              <div className="grid grid-cols-1 gap-3">
                {managingTagsKeeper.tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">ID: {tag.id}</div>
                      <div>
                        <span className="text-gray-700 font-medium">{tag.name}:</span>{" "}
                        <span className="text-blue-700">{tag.value}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {managingTagsKeeper && (!managingTagsKeeper.tags || managingTagsKeeper.tags.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma tag cadastrada</p>
            </div>
          )}
        </div>
      </DraggableModal>
    </div>
  );
}
