import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FundTransaction } from "@/hooks/useFundTransactions";
import { format } from "date-fns";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Link as LinkIcon,
  User 
} from "lucide-react";
import { Link } from "react-router-dom";

interface TransactionDetailDialogProps {
  transaction: FundTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange
}: TransactionDetailDialogProps) {
  const { isAdmin } = useUserRole();
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!transaction) return null;

  const handleAddNote = async () => {
    if (!adminNote.trim()) return;

    setIsSaving(true);
    try {
      const currentNotes = transaction.notes || "";
      const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      const newNote = `[${timestamp}] ${adminNote}`;
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n${newNote}`
        : newNote;

      const { error } = await supabase
        .from("fund_transactions")
        .update({ notes: updatedNotes })
        .eq("id", transaction.id);

      if (error) throw error;

      toast.success("Administrative note added successfully");
      setAdminNote("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add administrative note");
    } finally {
      setIsSaving(false);
    }
  };

  const getSourceLink = () => {
    if (transaction.reference_type === "contribution" && transaction.reference_id) {
      return "/contributors";
    }
    if (transaction.reference_type === "money_request" && transaction.reference_id) {
      return "/money-requests";
    }
    return null;
  };

  const sourceLink = getSourceLink();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transaction.debit_credit === "credit" ? (
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
            )}
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Transaction Type</div>
                  <Badge variant="outline" className="capitalize">
                    {transaction.transaction_type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Reference Type</div>
                  <Badge variant="secondary" className="capitalize">
                    {transaction.reference_type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Transaction Date
                  </div>
                  <div className="font-medium">
                    {format(new Date(transaction.transaction_date), "PPpp")}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Amount
                  </div>
                  <div className={`font-bold text-lg ${
                    transaction.debit_credit === "credit" 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {transaction.debit_credit === "credit" ? "+" : "-"}
                    ${transaction.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fund & Balance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fund & Balance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Fund Name</div>
                <div className="font-medium">{transaction.fund_types?.name || "N/A"}</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Balance Before</div>
                  <div className="font-medium">
                    ${transaction.balance_before.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Balance After</div>
                  <div className="font-medium text-primary">
                    ${transaction.balance_after.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description & Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="text-sm bg-muted p-3 rounded-md">
                  {transaction.description}
                </div>
              </div>

              {sourceLink && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" />
                      Source Record
                    </div>
                    <Link to={sourceLink}>
                      <Button variant="outline" size="sm" className="w-full">
                        View {transaction.reference_type === "contribution" ? "Contribution" : "Money Request"}
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {transaction.created_by && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Created By
                    </div>
                    <div className="text-sm font-mono bg-muted p-2 rounded">
                      {transaction.created_by}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes & Audit Trail */}
          {(transaction.notes || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes & Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transaction.notes && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Transaction Notes</div>
                    <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap font-mono">
                      {transaction.notes}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <>
                    {transaction.notes && <Separator />}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Add Administrative Note
                      </div>
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Enter administrative note..."
                        rows={3}
                      />
                      <Button 
                        onClick={handleAddNote}
                        disabled={!adminNote.trim() || isSaving}
                        size="sm"
                        className="w-full"
                      >
                        {isSaving ? "Saving..." : "Add Note"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Transaction ID</div>
                  <div className="font-mono text-[10px] break-all">{transaction.id}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Created At</div>
                  <div>{format(new Date(transaction.created_at), "PPpp")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
