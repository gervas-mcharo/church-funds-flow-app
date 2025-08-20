
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerContent?: React.ReactNode;
}

export function DashboardLayout({ children, title, description, headerContent }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      open={isMobile ? undefined : true}
    >
      <div className="min-h-screen w-full bg-background flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-all duration-300">
          <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
            <div className="flex items-center px-6 h-16">
              <SidebarTrigger className="mr-4 hover:bg-muted rounded-md p-2 transition-colors duration-200" />
              <DashboardHeader />
            </div>
            {(title || headerContent) && (
              <div className="px-6 py-4 border-t border-border/50">
                <div className="flex justify-between items-start">
                  <div className="animate-fade-in">
                    {title && <h1 className="text-3xl font-bold text-foreground">{title}</h1>}
                    {description && <p className="text-muted-foreground mt-1">{description}</p>}
                  </div>
                  {headerContent && <div className="animate-fade-in">{headerContent}</div>}
                </div>
              </div>
            )}
          </header>
          <main className="flex-1 p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
