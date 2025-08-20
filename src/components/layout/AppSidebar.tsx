
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  QrCode, 
  Users, 
  Database, 
  Settings, 
  FileText,
  Folder,
  User,
  HandHeart,
  DollarSign,
  Receipt
} from "lucide-react";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentFinancialPermissions } from "@/hooks/useDepartmentFinancialPermissions";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  requiresQRAccess?: boolean;
  requiresContributorAccess?: boolean;
  requiresFundAccess?: boolean;
  requiresPledgeAccess?: boolean;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "QR Management", url: "/qr-management", icon: QrCode, requiresQRAccess: true },
  { title: "Contributors", url: "/contributors", icon: Users, requiresContributorAccess: true },
  { title: "Funds", url: "/fund-types", icon: Database, requiresFundAccess: true },
  { title: "Departments", url: "/departments", icon: Folder },
  { title: "Pledges", url: "/pledges", icon: HandHeart, requiresPledgeAccess: true },
  { title: "Money Requests", url: "/money-requests", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "User Management", url: "/user-management", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Department treasurer specific menu items
const departmentTreasurerItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "My Departments", url: "/departments", icon: Folder },
  { title: "Department Funds", url: "/fund-types", icon: Database },
  { title: "Department Pledges", url: "/pledges", icon: HandHeart },
  { title: "Money Requests", url: "/money-requests", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const { canAccessPledges } = usePledgePermissions();
  const { canAccessQRManagement, canViewContributors, canViewFunds, userRole } = useUserRole();
  const { isChurchTreasurer, treasurerDepartments } = useDepartmentFinancialPermissions();

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `transition-all duration-200 relative overflow-hidden group ${
      isActive 
        ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium shadow-md" 
        : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 text-muted-foreground hover:text-foreground hover:shadow-sm"
    }`;

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Use department treasurer menu if user is only a department treasurer
  const isDepartmentTreasurerOnly = userRole === 'department_treasurer';
  const itemsToShow = isDepartmentTreasurerOnly ? departmentTreasurerItems : menuItems;

  // Filter menu items based on permissions
  const visibleMenuItems = itemsToShow.filter(item => {
    if (item.requiresPledgeAccess) {
      return canAccessPledges();
    }
    if (item.requiresQRAccess) {
      return canAccessQRManagement();
    }
    if (item.requiresContributorAccess) {
      return canViewContributors();
    }
    if (item.requiresFundAccess) {
      return canViewFunds();
    }
    return true;
  });

  return (
    <Sidebar className="w-64">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Church Finance</h2>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
          
          {/* Show role and department context for department treasurers */}
          {isDepartmentTreasurerOnly && treasurerDepartments.length > 0 && (
            <div className="mt-3 p-2 bg-green-50 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Department Treasurer</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                {treasurerDepartments.length === 1 
                  ? `Managing: ${treasurerDepartments[0].department_name}`
                  : `Managing ${treasurerDepartments.length} departments`
                }
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      onClick={handleNavigation}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg ${getNavCls({ isActive })}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <span className="transition-all duration-200">{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute inset-y-0 right-0 w-1 bg-primary rounded-l-full animate-scale-in" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
