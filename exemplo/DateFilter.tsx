import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Search } from "lucide-react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  loading = false
}: DateFilterProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="start-date" className="text-sm text-gray-600 mb-2 block">
            Data/Hora Início
          </Label>
          <input
            id="start-date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            step="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="end-date" className="text-sm text-gray-600 mb-2 block">
            Data/Hora Fim
          </Label>
          <input
            id="end-date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            step="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
        
        <Button 
          onClick={onSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto"
        >
          <Search className="w-5 h-5 mr-2" />
          Buscar
        </Button>
      </div>
    </Card>
  );
}