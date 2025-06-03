
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, DollarSign } from "lucide-react";
import { useMoneyRequests } from "@/hooks/useMoneyRequests";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { MoneyRequestDetails } from "./MoneyRequestDetails";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type MoneyRequest = Database["public"]["Tables"]["money_requests"]["Row"] & {
  requesting_department: { name: string } | null;
  requester: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  pending_hod_approval: "bg-yellow-100 text-yellow-800",
  pending_finance_elder_approval: "bg-orange-100 text-orange-800",
  pending_general_secretary_approval: "bg-purple-100 text-purple-800",
  pending_pastor_approval: "bg-pink-100 text-pink-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-gray-100 text-gray-800"
};

const statusLabels = {
  submitted: "Submitted",
  pending_hod_approval: "Pending HOD Approval",
  pending_finance_elder_approval: "Pending Finance Elder Approval",
  pending_general_secretary_approval: "Pending General Secretary Approval",
  pending_pastor_approval: "Pending Pastor Approval",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid"
};

export function MoneyRequestsList() {
  const { data: requests, isLoading } = useMoneyRequests();
  const { formatAmount } = useCurrencySettings();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  if (isLoading) {
    return <div>Loading requests...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Money Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No money requests found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Money Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {new Date(request.request_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.requesting_department?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {request.requester 
                      ? `${request.requester.first_name || ""} ${request.requester.last_name || ""}`.trim()
                      : "Unknown"
                    }
                  </TableCell>
                  <TableCell>
                    {formatAmount(parseFloat(request.amount.toString()))}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {request.purpose}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequest && (
        <MoneyRequestDetails
          requestId={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </>
  );
}
