
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
  User
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "QR Management", url: "/qr-management", icon: QrCode },
  { title: "Contributors", url: "/contributors", icon: Users },
  { title: "Fund Types", url: "/fund-types", icon: Database },
  { title: "Departments", url: "/departments", icon: Folder },
  { title: "Money Requests", url: "/money-requests", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "User Management", url: "/user-management", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-blue-100 text-blue-700 font-medium border-r-2 border-blue-700" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-gray-900">Church Finance</h2>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-medium px-3 py-2">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavCls({ isActive })}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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
