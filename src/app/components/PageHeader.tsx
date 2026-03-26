import { ReactNode } from "react";
import { Card } from "./ui/card";
import { Weight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function PageHeader({ title, icon, description }: PageHeaderProps) {
  return (
    <Card
      className="p-6 bg-white shadow-sm"
      style={{ marginBottom: 15, paddingBottom: 5 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2 mb-1">
          <div style={{ color: "#3f82e6ff" }}>{icon}</div>
          {title}
        </h1>
        <p className="text-surface-600 dark:text-surface-400 text-sm mt-0.5">
          {description}
        </p>
      </div>
    </Card>
  );
}
