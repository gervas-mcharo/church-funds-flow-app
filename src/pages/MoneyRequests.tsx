
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, List } from "lucide-react";
import { MoneyRequestForm } from "@/components/money-requests/MoneyRequestForm";
import { MoneyRequestsList } from "@/components/money-requests/MoneyRequestsList";

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
            <MoneyRequestsList />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <MoneyRequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MoneyRequests;
