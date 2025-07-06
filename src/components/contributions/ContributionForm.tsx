import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, User, DollarSign } from 'lucide-react';
import { useContributors } from '@/hooks/useContributors';
import { useFundTypes } from '@/hooks/useFundTypes';
import { useCreateContribution } from '@/hooks/useContributions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const contributionSchema = z.object({
  contributorId: z.string().min(1, 'Contributor is required'),
  fundTypeId: z.string().min(1, 'Fund type is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  notes: z.string().optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionFormProps {
  onClose: () => void;
  initialData?: {
    contributorId?: string;
    fundTypeId?: string;
    contributorName?: string;
    fundTypeName?: string;
  };
  onSuccess?: () => void;
}

export const ContributionForm = ({ onClose, initialData, onSuccess }: ContributionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: contributors } = useContributors();
  const { data: fundTypes } = useFundTypes();
  const createContribution = useCreateContribution();

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contributorId: initialData?.contributorId || '',
      fundTypeId: initialData?.fundTypeId || '',
      amount: '',
      notes: '',
    },
  });

  const handleSubmit = async (data: ContributionFormData) => {
    setIsSubmitting(true);
    try {
      await createContribution.mutateAsync({
        contributor_id: data.contributorId,
        fund_type_id: data.fundTypeId,
        amount: parseFloat(data.amount),
        notes: data.notes || null,
        contribution_date: new Date().toISOString(),
      });

      toast({
        title: 'Contribution Recorded',
        description: `Successfully recorded contribution of $${data.amount}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record contribution. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedContributor = contributors?.find(c => c.id === form.watch('contributorId'));
  const selectedFundType = fundTypes?.find(f => f.id === form.watch('fundTypeId'));

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Record Contribution
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, MMM dd, yyyy')} at {format(new Date(), 'h:mm a')}
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="contributor">Contributor</Label>
            <Select
              value={form.watch('contributorId')}
              onValueChange={(value) => form.setValue('contributorId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={initialData?.contributorName || "Select contributor"} />
              </SelectTrigger>
              <SelectContent>
                {contributors?.map((contributor) => (
                  <SelectItem key={contributor.id} value={contributor.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {contributor.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.contributorId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.contributorId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="fundType">Fund Type</Label>
            <Select
              value={form.watch('fundTypeId')}
              onValueChange={(value) => form.setValue('fundTypeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={initialData?.fundTypeName || "Select fund type"} />
              </SelectTrigger>
              <SelectContent>
                {fundTypes?.map((fundType) => (
                  <SelectItem key={fundType.id} value={fundType.id}>
                    {fundType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.fundTypeId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.fundTypeId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register('amount')}
              className="text-lg font-medium"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this contribution..."
              {...form.register('notes')}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Recording...' : 'Record Contribution'}
            </Button>
          </div>
        </form>

        {(initialData?.contributorName || initialData?.fundTypeName) && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">From QR Code:</p>
            {initialData.contributorName && (
              <p className="text-sm text-muted-foreground">
                Contributor: {initialData.contributorName}
              </p>
            )}
            {initialData.fundTypeName && (
              <p className="text-sm text-muted-foreground">
                Fund: {initialData.fundTypeName}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};