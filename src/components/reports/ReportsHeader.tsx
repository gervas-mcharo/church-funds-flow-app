
import { FileText, Download, BarChart3 } from "lucide-react";

export function ReportsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate detailed contribution reports and analytics</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="h-4 w-4" />
          <span>Analytics & Insights</span>
        </div>
      </div>
    </div>
  );
}
