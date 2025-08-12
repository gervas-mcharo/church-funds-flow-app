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
  Home,
  LucideIcon
} from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentFinancialPermissions } from "@/hooks/useDepartmentFinancialPermissions";

interface MenuItem {
  name: string;
  url: string;
  icon: LucideIcon;
  requiresQRAccess?: boolean;
  requiresContributorAccess?: boolean;
  requiresFundAccess?: boolean;
  requiresPledgeAccess?: boolean;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", url: "/", icon: Home },
  { name: "QR Management", url: "/qr-management", icon: QrCode, requiresQRAccess: true },
  { name: "Contributors", url: "/contributors", icon: Users, requiresContributorAccess: true },
  { name: "Funds", url: "/fund-types", icon: Database, requiresFundAccess: true },
  { name: "Departments", url: "/departments", icon: Folder },
  { name: "Pledges", url: "/pledges", icon: HandHeart, requiresPledgeAccess: true },
  { name: "Money Requests", url: "/money-requests", icon: FileText },
  { name: "Reports", url: "/reports", icon: BarChart3 },
  { name: "User Management", url: "/user-management", icon: User },
  { name: "Settings", url: "/settings", icon: Settings },
];

// Department treasurer specific menu items
const departmentTreasurerItems: MenuItem[] = [
  { name: "Dashboard", url: "/", icon: Home },
  { name: "My Departments", url: "/departments", icon: Folder },
  { name: "Department Funds", url: "/fund-types", icon: Database },
  { name: "Department Pledges", url: "/pledges", icon: HandHeart },
  { name: "Money Requests", url: "/money-requests", icon: FileText },
  { name: "Reports", url: "/reports", icon: BarChart3 },
  { name: "Settings", url: "/settings", icon: Settings },
];

export function AppNavBar() {
  const { canAccessPledges } = usePledgePermissions();
  const { canAccessQRManagement, canViewContributors, canViewFunds, userRole } = useUserRole();
  const { treasurerDepartments } = useDepartmentFinancialPermissions();

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

  return <NavBar items={visibleMenuItems} />;
}