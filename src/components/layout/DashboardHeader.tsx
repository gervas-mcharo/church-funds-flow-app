
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
