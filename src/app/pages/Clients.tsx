import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/PageHeader";
import { DraggableModal } from "../components/DraggableModal";
import { Edit2, Loader2, Plus, Save, Search, Trash2, Users } from "lucide-react";
import { apiJson, apiRequest, buildPageParams } from "../lib/api";

interface Client {
  id: number;
  name: string;
  alias: string;
}

interface ClientListResponse {
  content: Client[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

interface ClientFormData {
  reference: number;
  name: string;
  alias: string;
}

interface PageResponseClientSimpleModel {
  content: Client[];
  pageNumber: number;
  totalPages: number;
  totalElements: number;
}

async function fetchClients(page = 0, size = 10, sort: string[] = []): Promise<ClientListResponse> {
  const params = buildPageParams(page, size, sort);
  const data = await apiJson<PageResponseClientSimpleModel>(`/clients?${params.toString()}`);
  return {
    content: data.content,
    pageNumber: data.pageNumber,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  };
}

async function createClient(data: ClientFormData): Promise<Client> {
  return apiJson<Client>("/clients", {
    method: "POST",
    body: JSON.stringify({ reference: data.reference, name: data.name, alias: data.alias }),
  });
}

async function updateClient(clientId: number, data: ClientFormData): Promise<Client> {
  return apiJson<Client>(`/clients/${clientId}`, {
    method: "PUT",
    body: JSON.stringify({ reference: data.reference, name: data.name, alias: data.alias }),
  });
}

async function deleteClient(clientId: number): Promise<void> {
  await apiRequest(`/clients/${clientId}`, { method: "DELETE" });
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    reference: 0,
    name: "",
    alias: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await fetchClients(page, pageSize);
      setClients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [page]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.alias.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Nome e obrigatorio";
    }

    if (!formData.alias.trim()) {
      errors.alias = "Alias e obrigatorio";
    }

    if (!formData.reference || formData.reference <= 0) {
      errors.reference = "Referencia deve ser um numero positivo";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        alias: client.alias,
        reference: client.reference,
      });
    } else {
      setEditingClient(null);
      setFormData({ reference: 0, name: "", alias: "" });
    }

    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ reference: 0, name: "", alias: "" });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      handleCloseModal();
      loadClients();
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (clientId: number) => {
    setClientToDelete(clientId);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    setLoading(true);
    try {
      await deleteClient(clientToDelete);
      handleCloseDeleteModal();
      loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Users />}
        title="Cadastro de Clientes"
        description="Gerencie os clientes do sistema"
      />

      <Card className="p-6 bg-white shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm text-gray-600 mb-2 block">
              Buscar Cliente
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome ou apelido do cliente..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 h-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl text-gray-800">Lista de Clientes</h2>
          <span className="text-sm text-gray-600">Total: {totalElements} cliente(s)</span>
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
                    <th className="text-left py-3 px-4 text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 text-gray-600">Apelido</th>
                    <th className="text-right py-3 px-4 text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{client.id}</td>
                        <td className="py-3 px-4 text-gray-900">{client.name}</td>
                        <td className="py-3 px-4 text-gray-700">{client.alias}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(client)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(client.id)}
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
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
        onClose={handleCloseModal}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reference" className="text-sm text-gray-600 mb-2 block">
              Referencia *
            </Label>
            <input
              id="reference"
              type="number"
              value={formData.reference || ""}
              onChange={(e) =>
                setFormData({ ...formData, reference: parseInt(e.target.value) || 0 })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.reference ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: 12345"
            />
            {formErrors.reference && (
              <p className="text-red-500 text-sm mt-1">{formErrors.reference}</p>
            )}
          </div>

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
              placeholder="Ex: Hospital Albert Einstein"
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="alias" className="text-sm text-gray-600 mb-2 block">
              Apelido *
            </Label>
            <input
              id="alias"
              type="text"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.alias ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Einstein-SP"
            />
            {formErrors.alias && (
              <p className="text-red-500 text-sm mt-1">{formErrors.alias}</p>
            )}
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
                  {editingClient ? "Atualizar" : "Criar"}
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
          Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita.
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
