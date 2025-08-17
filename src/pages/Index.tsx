import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FundOverviewCards } from "@/components/dashboard/FundOverviewCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ContributionChart } from "@/components/dashboard/ContributionChart";
const Index = () => {
  return (
    <DashboardLayout 
      title="Dashboard" 
      description="Manage contributions, track expenses, and oversee church finances"
    >
      <div className="space-y-6">
        
        <FundOverviewCards />
        
        <div className="grid grid-cols-1 gap-6">
          <ContributionChart />
        </div>
        
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Index;