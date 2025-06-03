
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar } from "lucide-react";
import { useCreatePledge } from "@/hooks/usePledges";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

export function CreatePledgeDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    contributor_id: "",
    fund_type_id: "",
    pledge_amount: "",
    frequency: "one_time" as const,
    installment_amount: "",
    number_of_installments: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    purpose: "",
    notes: ""
  });

  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const createPledge = useCreatePledge();
  const { currencySymbol } = useCurrencySettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contributor_id || !formData.fund_type_id || !formData.pledge_amount) {
      return;
    }

    const pledgeData = {
      contributor_id: formData.contributor_id,
      fund_type_id: formData.fund_type_id,
      pledge_amount: parseFloat(formData.pledge_amount),
      frequency: formData.frequency,
      installment_amount: formData.installment_amount ? parseFloat(formData.installment_amount) : undefined,
      number_of_installments: formData.number_of_installments ? parseInt(formData.number_of_installments) : undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      purpose: formData.purpose || undefined,
      notes: formData.notes || undefined
    };

    try {
      await createPledge.mutateAsync(pledgeData);
      setFormData({
        contributor_id: "",
        fund_type_id: "",
        pledge_amount: "",
        frequency: "one_time",
        installment_amount: "",
        number_of_installments: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        purpose: "",
        notes: ""
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating pledge:', error);
    }
  };

  const showInstallmentFields = formData.frequency !== "one_time";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Pledge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pledge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contributor">Contributor *</Label>
              <Select value={formData.contributor_id} onValueChange={(value) => setFormData({...formData, contributor_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contributor" />
                </SelectTrigger>
                <SelectContent>
                  {contributors.map((contributor) => (
                    <SelectItem key={contributor.id} value={contributor.id}>
                      {contributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fund_type">Fund Type *</Label>
              <Select value={formData.fund_type_id} onValueChange={(value) => setFormData({...formData, fund_type_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pledge_amount">Pledge Amount ({currencySymbol}) *</Label>
              <Input
                id="pledge_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.pledge_amount}
                onChange={(e) => setFormData({...formData, pledge_amount: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={formData.frequency} onValueChange={(value: any) => setFormData({...formData, frequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showInstallmentFields && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installment_amount">Installment Amount ({currencySymbol})</Label>
                <Input
                  id="installment_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.installment_amount}
                  onChange={(e) => setFormData({...formData, installment_amount: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_installments">Number of Installments</Label>
                <Input
                  id="number_of_installments"
                  type="number"
                  min="1"
                  value={formData.number_of_installments}
                  onChange={(e) => setFormData({...formData, number_of_installments: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="e.g., Building Fund Expansion"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes about this pledge..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPledge.isPending}>
              {createPledge.isPending ? "Creating..." : "Create Pledge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
