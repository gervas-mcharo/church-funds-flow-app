
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FundOverviewCards } from "@/components/dashboard/FundOverviewCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ContributionChart } from "@/components/dashboard/ContributionChart";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Church Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage contributions, track expenses, and oversee church finances</p>
        </div>
        
        <FundOverviewCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ContributionChart />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
        
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Index;
