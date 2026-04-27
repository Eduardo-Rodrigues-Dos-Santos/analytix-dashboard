import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart3,
  Radio,
  Users,
  UsersRound,
  TrendingUp,
  Target,
} from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface SubMenuItem {
  path: string;
  label: string;
  icon: any;
}

interface MenuItem {
  path?: string;
  label: string;
  icon: any;
  subItems?: SubMenuItem[];
}

export function Navigation({ isCollapsed, setIsCollapsed }: NavigationProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "Cadastros",
    "Análises",
  ]);

  const menuItems: MenuItem[] = [
    {
      path: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Cadastros",
      icon: FileText,
      subItems: [
        { path: "/cadastros/keepers", label: "Keepers", icon: Radio },
        { path: "/cadastros/clientes", label: "Clientes", icon: Users },
        { path: "/cadastros/grupos", label: "Grupos", icon: UsersRound },
        { path: "/cadastros/metas", label: "Metas", icon: Target },
      ],
    },
    {
      label: "Análises",
      icon: BarChart3,
      subItems: [
        { path: "/analises/clientes", label: "Clientes", icon: TrendingUp },
        {
          path: "/analises/metricas-gerais",
          label: "Métricas Gerais",
          icon: TrendingUp,
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isMenuExpanded = (label: string) => {
    return expandedMenus.includes(label);
  };

  const toggleMenu = (label: string) => {
    if (expandedMenus.includes(label)) {
      setExpandedMenus(expandedMenus.filter((m) => m !== label));
    } else {
      setExpandedMenus([...expandedMenus, label]);
    }
  };

  const isSubMenuActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some((item) => location.pathname === item.path);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        <div className="p-6 flex flex-col h-full overflow-hidden">
          {/* Header with Toggle Button */}
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            {!isCollapsed && (
              <h1 className="text-xl text-gray-900">GAO Lavanderia</h1>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors ml-auto"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const expanded = isMenuExpanded(item.label);
              const active = item.path
                ? isActive(item.path)
                : isSubMenuActive(item.subItems);

              if (!hasSubItems && item.path) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              }

              return (
                <div key={item.label}>
                  <button
                    onClick={() => !isCollapsed && toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${isCollapsed ? "justify-center" : "justify-between"}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed &&
                      hasSubItems &&
                      (expanded ? (
                        <ChevronUp className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ))}
                  </button>

                  {!isCollapsed && hasSubItems && expanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.path);

                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              subActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
