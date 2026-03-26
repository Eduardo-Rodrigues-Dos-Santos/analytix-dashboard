import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";

import Dashboard from "./pages/Dashboard";
import Keepers from "./pages/Keepers";
import ClientAnalysis from "./pages/ClientAnalysis";

export default function App() {

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      <Navigation
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`${isCollapsed ? "lg:ml-20" : "lg:ml-64"} transition-all`}>

        <Routes>

          <Route path="/" element={<Dashboard />} />

          <Route path="/keepers" element={<Keepers />} />

          <Route path="/client-analysis" element={<ClientAnalysis />} />

        </Routes>

      </div>
    </div>
  );
}