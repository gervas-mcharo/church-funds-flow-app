
import { DashboardHeader } from "@/components/layout/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <DashboardHeader />
      <main className="pt-16 pb-6 px-6">
        {children}
      </main>
    </div>
  );
}
