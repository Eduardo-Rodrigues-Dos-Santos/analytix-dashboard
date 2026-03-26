import { Card } from "../components/ui/card";
import { PageHeader } from "../components/PageHeader";
import { LayoutDashboard } from "lucide-react";

export function Dashboard() {
  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title="Dashboard Lavanderia"
        description="Visao geral do sistema"
      />

      <Card className="p-6 bg-white shadow-sm">
        <p className="text-gray-600">
          O dashboard antigo (grafico e resumo estatico) foi removido. Esta pagina vai ser reconstruida com dados reais da API.
        </p>
      </Card>
    </div>
  );
}
