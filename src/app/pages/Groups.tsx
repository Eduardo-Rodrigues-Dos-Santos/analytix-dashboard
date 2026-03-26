import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import { DraggableModal } from "../components/DraggableModal";
import { Edit2, Loader2, Plus, Save, Search, Trash2, Users } from "lucide-react";
import { apiJson, apiRequest, buildPageParams } from "../lib/api";

interface GroupListItem {
  id: number;
  name: string;
}

interface GroupListResponse {
  content: GroupListItem[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

interface Client {
  id: number;
  name: string;
  alias: string;
}

interface GroupFormData {
  name: string;
}

interface PageResponseGroupSimpleModel {
  content: GroupListItem[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

interface PageResponseClientSimpleModel {
  content: Client[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

async function fetchGroups(page = 0, size = 10, sort: string[] = []): Promise<GroupListResponse> {
  const params = buildPageParams(page, size, sort);
  const data = await apiJson<PageResponseGroupSimpleModel>(`/groups?${params.toString()}`);
  return {
    content: data.content,
    pageNumber: data.pageNumber,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  };
}

async function createGroup(data: GroupFormData): Promise<void> {
  await apiRequest("/groups", {
    method: "POST",
    body: JSON.stringify({ name: data.name }),
  });
}

async function updateGroup(groupId: number, data: GroupFormData): Promise<void> {
  await apiRequest(`/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify({ name: data.name }),
  });
}

async function deleteGroup(groupId: number): Promise<void> {
  await apiRequest(`/groups/${groupId}`, { method: "DELETE" });
}

async function fetchGroupClients(groupId: number): Promise<Client[]> {
  return apiJson<Client[]>(`/groups/${groupId}/clients`);
}

async function fetchClientsPage(page: number, size: number): Promise<PageResponseClientSimpleModel> {
  const params = buildPageParams(page, size);
  return apiJson<PageResponseClientSimpleModel>(`/clients?${params.toString()}`);
}

async function fetchAllClients(): Promise<Client[]> {
  const size = 200;
  const maxPages = 30;
  const all: Client[] = [];

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchClientsPage(page, size);
    all.push(...data.content);
    if (page >= data.totalPages - 1) break;
  }

  return all;
}

async function attachClients(groupId: number, clientIds: number[]): Promise<void> {
  await apiRequest(`/group/${groupId}/attach-clients`, {
    method: "PUT",
    body: JSON.stringify({ ids: clientIds }),
  });
}

async function detachClients(groupId: number, clientIds: number[]): Promise<void> {
  await apiRequest(`/group/${groupId}/detach-clients`, {
    method: "PUT",
    body: JSON.stringify({ ids: clientIds }),
  });
}

export function Groups() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupListItem | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<GroupFormData>({ name: "" });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [managingGroup, setManagingGroup] = useState<GroupListItem | null>(null);
  const [groupClients, setGroupClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientsSearchTerm, setClientsSearchTerm] = useState("");
  const [clientsModalError, setClientsModalError] = useState<string | null>(null);

  const [selectedAttachIds, setSelectedAttachIds] = useState<number[]>([]);
  const [selectedDetachIds, setSelectedDetachIds] = useState<number[]>([]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetchGroups(page, pageSize);
      setGroups(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [page]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Nome e obrigatorio";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (group?: GroupListItem) => {
    if (group) {
      setEditingGroup(group);
      setFormData({ name: group.name });
    } else {
      setEditingGroup(null);
      setFormData({ name: "" });
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData({ name: "" });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, formData);
      } else {
        await createGroup(formData);
      }

      handleCloseModal();
      loadGroups();
    } catch (error) {
      console.error("Error saving group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (groupId: number) => {
    setGroupToDelete(groupId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setLoading(true);
    try {
      await deleteGroup(groupToDelete);
      handleCloseDeleteModal();
      loadGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientsModal = async (group: GroupListItem) => {
    setIsClientsModalOpen(true);
    setManagingGroup(group);
    setClientsModalError(null);

    setGroupClients([]);
    setAllClients([]);
    setSelectedAttachIds([]);
    setSelectedDetachIds([]);
    setClientsSearchTerm("");

    setLoading(true);
    try {
      const [clientsInGroup, clients] = await Promise.all([
        fetchGroupClients(group.id),
        fetchAllClients(),
      ]);

      setGroupClients(clientsInGroup);
      setAllClients(clients);
    } catch (error) {
      console.error("Error loading group clients:", error);
      setClientsModalError("Erro ao carregar clientes do grupo");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseClientsModal = () => {
    setIsClientsModalOpen(false);
    setManagingGroup(null);
    setGroupClients([]);
    setAllClients([]);
    setSelectedAttachIds([]);
    setSelectedDetachIds([]);
    setClientsSearchTerm("");
    setClientsModalError(null);
  };

  const toggleAttachSelection = (clientId: number) => {
    setSelectedAttachIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleDetachSelection = (clientId: number) => {
    setSelectedDetachIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const reloadGroupClients = async () => {
    if (!managingGroup) return;
    const updated = await fetchGroupClients(managingGroup.id);
    setGroupClients(updated);
  };

  const handleAttachClients = async () => {
    if (!managingGroup || selectedAttachIds.length === 0) return;

    setLoading(true);
    try {
      await attachClients(managingGroup.id, selectedAttachIds);
      await reloadGroupClients();
      setSelectedAttachIds([]);
      setSelectedDetachIds([]);
    } catch (error) {
      console.error("Error attaching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetachClients = async () => {
    if (!managingGroup || selectedDetachIds.length === 0) return;

    setLoading(true);
    try {
      await detachClients(managingGroup.id, selectedDetachIds);
      await reloadGroupClients();
      setSelectedAttachIds([]);
      setSelectedDetachIds([]);
    } catch (error) {
      console.error("Error detaching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const clientsNotInGroup = allClients.filter(
    (client) => !groupClients.some((c) => c.id === client.id)
  );

  const filteredAvailableClients = clientsNotInGroup.filter(
    (client) =>
      client.name.toLowerCase().includes(clientsSearchTerm.toLowerCase()) ||
      client.alias.toLowerCase().includes(clientsSearchTerm.toLowerCase())
  );

  const filteredGroupClients = groupClients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientsSearchTerm.toLowerCase()) ||
      client.alias.toLowerCase().includes(clientsSearchTerm.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        icon={<Users />}
        title="Cadastro de Grupos"
        description="Gerencie os grupos de clientes do sistema"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm text-gray-600 mb-2 block">
              Buscar Grupo
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do grupo..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Grupo
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-gray-800">Lista de Grupos</h2>
          <span className="text-sm text-gray-600">Total: {totalElements} grupo(s)</span>
        </div>

        {loading && !isModalOpen && !isDeleteModalOpen && !isClientsModalOpen ? (
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
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado"}
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{group.id}</td>
                        <td className="py-3 px-4 text-gray-900">{group.name}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(group)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(group.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenClientsModal(group)}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Clientes
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
        title={editingGroup ? "Editar Grupo" : "Novo Grupo"}
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
              placeholder="Ex: Grupo Hospitalar"
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
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
                  {editingGroup ? "Atualizar" : "Criar"}
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
          Tem certeza que deseja excluir este grupo? Esta acao nao pode ser desfeita.
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
        isOpen={isClientsModalOpen}
        onClose={handleCloseClientsModal}
        title={`Gerenciar Clientes - ${managingGroup?.name || ""}`}
        maxWidth="4xl"
      >
        <div className="mb-4">
          <Label htmlFor="clientsSearch" className="text-sm text-gray-600 mb-2 block">
            Buscar Cliente
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="clientsSearch"
              type="text"
              value={clientsSearchTerm}
              onChange={(e) => setClientsSearchTerm(e.target.value)}
              placeholder="Digite o nome ou alias do cliente..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {clientsModalError && (
          <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700">
            {clientsModalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg text-gray-900 mb-3">Clientes Disponiveis</h3>
            <div className="border border-gray-200 rounded-md p-3 h-96 overflow-y-auto">
              {loading && allClients.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              ) : filteredAvailableClients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum cliente disponivel</p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAttachIds.includes(client.id)}
                        onChange={() => toggleAttachSelection(client.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.alias}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleAttachClients}
              disabled={selectedAttachIds.length === 0 || loading}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Selecionados ({selectedAttachIds.length})
            </Button>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 mb-3">Clientes no Grupo</h3>
            <div className="border border-gray-200 rounded-md p-3 h-96 overflow-y-auto">
              {loading && managingGroup && groupClients.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              ) : filteredGroupClients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum cliente no grupo</p>
              ) : (
                <div className="space-y-2">
                  {filteredGroupClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDetachIds.includes(client.id)}
                        onChange={() => toggleDetachSelection(client.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.alias}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleDetachClients}
              disabled={selectedDetachIds.length === 0 || loading}
              className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover Selecionados ({selectedDetachIds.length})
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleCloseClientsModal} variant="outline">
            Fechar
          </Button>
        </div>
      </DraggableModal>
    </div>
  );
}
