
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { Pledge, useUpdatePledge } from "@/hooks/usePledges";
import { useForm } from "react-hook-form";

interface PledgeManagementActionsProps {
  pledge: Pledge;
}

interface UpdatePledgeForm {
  pledge_amount: number;
  installment_amount?: number;
  number_of_installments?: number;
  start_date: string;
  end_date?: string;
  next_payment_date?: string;
  status: string;
  purpose?: string;
  notes?: string;
}

export function PledgeManagementActions({ pledge }: PledgeManagementActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  
  const updatePledge = useUpdatePledge();
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<UpdatePledgeForm>({
    defaultValues: {
      pledge_amount: pledge.pledge_amount,
      installment_amount: pledge.installment_amount || undefined,
      number_of_installments: pledge.number_of_installments || undefined,
      start_date: pledge.start_date,
      end_date: pledge.end_date || undefined,
      next_payment_date: pledge.next_payment_date || undefined,
      status: pledge.status,
      purpose: pledge.purpose || '',
      notes: pledge.notes || ''
    }
  });
  
  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-blue-500' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-gray-500' },
    { value: 'partially_fulfilled', label: 'Partially Fulfilled', color: 'bg-yellow-500' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'bg-green-500' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-400' }
  ];
  
  const onSubmit = async (data: UpdatePledgeForm) => {
    await updatePledge.mutateAsync({
      id: pledge.id,
      updates: {
        ...data,
        pledge_amount: Number(data.pledge_amount),
        installment_amount: data.installment_amount ? Number(data.installment_amount) : undefined,
      }
    });
    setEditOpen(false);
  };
  
  const handleStatusChange = async (newStatus: string) => {
    await updatePledge.mutateAsync({
      id: pledge.id,
      updates: {
        status: newStatus as any,
        notes: statusChangeReason ? `${pledge.notes || ''}\n\nStatus changed to ${newStatus}: ${statusChangeReason}` : pledge.notes
      }
    });
    setStatusChangeOpen(false);
    setStatusChangeReason('');
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {/* Edit Pledge Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pledge Details</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pledge_amount">Total Pledge Amount</Label>
                <Input
                  id="pledge_amount"
                  type="number"
                  step="0.01"
                  {...register('pledge_amount', { required: true, min: 0 })}
                />
              </div>
              
              <div>
                <Label htmlFor="installment_amount">Installment Amount</Label>
                <Input
                  id="installment_amount"
                  type="number"
                  step="0.01"
                  {...register('installment_amount')}
                />
              </div>
              
              <div>
                <Label htmlFor="number_of_installments">Number of Installments</Label>
                <Input
                  id="number_of_installments"
                  type="number"
                  {...register('number_of_installments')}
                />
              </div>
              
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date', { required: true })}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                />
              </div>
              
              <div>
                <Label htmlFor="next_payment_date">Next Payment Date</Label>
                <Input
                  id="next_payment_date"
                  type="date"
                  {...register('next_payment_date')}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                {...register('purpose')}
                placeholder="Purpose or description of the pledge"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePledge.isPending}>
                {updatePledge.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Status Change Dialog */}
      <Dialog open={statusChangeOpen} onOpenChange={setStatusChangeOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Change Status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Pledge Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Current Status</Label>
              <div className="mt-1">
                <Badge className={`${statusOptions.find(s => s.value === pledge.status)?.color} text-white`}>
                  {pledge.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label>New Status</Label>
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.filter(s => s.value !== pledge.status).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Change (Optional)</Label>
              <Textarea
                id="reason"
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                placeholder="Enter reason for status change"
                rows={3}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quick Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange('fulfilled')}
        disabled={pledge.status === 'fulfilled'}
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Mark Fulfilled
      </Button>
    </div>
  );
}
