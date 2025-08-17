
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerContent?: React.ReactNode;
}

export function DashboardLayout({ children, title, description, headerContent }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center px-6 h-16">
            <SidebarTrigger className="mr-4" />
            <DashboardHeader />
          </div>
          {(title || headerContent) && (
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
                  {description && <p className="text-gray-600 mt-1">{description}</p>}
                </div>
                {headerContent && <div>{headerContent}</div>}
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
