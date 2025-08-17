
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SecureCreatePledgeDialog } from "@/components/pledges/SecureCreatePledgeDialog";
import { SecureBulkPledgeImportDialog } from "@/components/pledges/SecureBulkPledgeImportDialog";
import { PledgesTable } from "@/components/pledges/PledgesTable";
import { PledgeFilters } from "@/components/pledges/PledgeFilters";
import { PledgeDetailsDialog } from "@/components/pledges/PledgeDetailsDialog";
import { PledgeReports } from "@/components/pledges/PledgeReports";
import { PledgeAccessGuard } from "@/components/pledges/PledgeAccessGuard";
import { PledgePermissionBadge } from "@/components/pledges/PledgePermissionBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, TrendingUp, DollarSign, Users, FileText, BarChart3, Shield } from "lucide-react";
import { usePledges, usePledgeStats, Pledge } from "@/hooks/usePledges";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { usePledgePermissions } from "@/hooks/usePledgePermissions";

const Pledges = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    contributor_id: "all",
    fund_type_id: "all"
  });
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pledges' | 'reports'>('pledges');

  const { getPledgeAccessLevel } = usePledgePermissions();

  // Convert "all" values to empty strings for the API
  const apiFilters = {
    search: filters.search,
    status: filters.status === "all" ? "" : filters.status,
    contributor_id: filters.contributor_id === "all" ? "" : filters.contributor_id,
    fund_type_id: filters.fund_type_id === "all" ? "" : filters.fund_type_id
  };

  const { data: pledges = [], isLoading } = usePledges(apiFilters);
  const { data: stats } = usePledgeStats();
  const { formatAmount } = useCurrencySettings();

  const handleViewPledge = (pledge: Pledge) => {
    setSelectedPledge(pledge);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading pledges...</div>
        </div>
      </DashboardLayout>
    );
  }

  const headerContent = (
    <div>
      <div className="mb-3">
        <PledgePermissionBadge />
      </div>
      <div className="flex gap-3">
        <SecureBulkPledgeImportDialog />
        <SecureCreatePledgeDialog />
      </div>
    </div>
  );

  return (
    <DashboardLayout 
      title="Pledge Management" 
      description="Track and manage contributor pledges"
      headerContent={headerContent}
    >
      <PledgeAccessGuard>
        <div className="space-y-6">
          {/* Security Notice for Limited Access */}
          {getPledgeAccessLevel() === 'view' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You have view-only access to pledges. Contact your administrator for additional permissions.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pledges" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pledge Management
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports & Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pledges" className="space-y-6">
              {/* Stats Overview */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Pledges</CardTitle>
                      <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalActivePledges}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently active commitments
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Pledged</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatAmount(stats.totalPledgedAmount)}</div>
                      <p className="text-xs text-muted-foreground">
                        All time commitments
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatAmount(stats.totalPaidAmount)}</div>
                      <p className="text-xs text-muted-foreground">
                        Received towards pledges
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
                      <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.fulfillmentRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Overall completion rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Status Distribution */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pledge Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(stats.statusCounts).map(([status, count]) => (
                        <Badge key={status} variant="outline" className="text-sm">
                          {status.replace('_', ' ')}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <PledgeFilters filters={filters} onFiltersChange={setFilters} />

              {/* Pledges Table */}
              <PledgesTable pledges={pledges} onView={handleViewPledge} />

              {pledges.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pledges found</h3>
                  <p className="text-gray-600 mb-4">
                    {filters.search || filters.status !== "all" || filters.contributor_id !== "all" || filters.fund_type_id !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "Get started by creating your first pledge."}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <SecureBulkPledgeImportDialog />
                    <SecureCreatePledgeDialog />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <PledgeReports />
            </TabsContent>
          </Tabs>

          {/* Pledge Details Dialog */}
          <PledgeDetailsDialog
            pledge={selectedPledge}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
        </div>
      </PledgeAccessGuard>
    </DashboardLayout>
  );
};

export default Pledges;
