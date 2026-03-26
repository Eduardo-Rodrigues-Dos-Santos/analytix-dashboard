import { Outlet } from "react-router";
import { Navigation } from "../components/Navigation";
import { useState } from "react";

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div
        className={`flex-1 transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
