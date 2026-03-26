import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Keepers } from "./pages/Keepers";
import { Clients } from "./pages/Clients";
import { Groups } from "./pages/Groups";
import { ClientAnalysis } from "./pages/ClientAnalysis";
import { GeneralMetrics } from "./pages/GeneralMetrics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "cadastros/keepers",
        Component: Keepers,
      },
      {
        path: "cadastros/clientes",
        Component: Clients,
      },
      {
        path: "cadastros/grupos",
        Component: Groups,
      },
      {
        path: "analises/clientes",
        Component: ClientAnalysis,
      },
      {
        path: "analises/metricas-gerais",
        Component: GeneralMetrics,
      },
    ],
  },
]);
