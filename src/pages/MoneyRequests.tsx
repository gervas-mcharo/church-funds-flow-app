
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, List } from "lucide-react";
import { EnhancedMoneyRequestForm } from "@/components/money-requests/EnhancedMoneyRequestForm";
import { EnhancedMoneyRequestsList } from "@/components/money-requests/EnhancedMoneyRequestsList";

const MoneyRequests = () => {
  return (
    <DashboardLayout 
      title="Money Requests" 
      description="Manage financial requests and approvals"
    >
      <div className="space-y-6">

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              View Requests
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <EnhancedMoneyRequestsList />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <EnhancedMoneyRequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MoneyRequests;
