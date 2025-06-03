
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";

interface PledgeFiltersProps {
  filters: {
    search: string;
    status: string;
    contributor_id: string;
    fund_type_id: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function PledgeFilters({ filters, onFiltersChange }: PledgeFiltersProps) {
  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pledges..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="partially_fulfilled">Partially Fulfilled</SelectItem>
          <SelectItem value="fulfilled">Fulfilled</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.contributor_id} onValueChange={(value) => onFiltersChange({ ...filters, contributor_id: value })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Contributors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Contributors</SelectItem>
          {contributors.map((contributor) => (
            <SelectItem key={contributor.id} value={contributor.id}>
              {contributor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.fund_type_id} onValueChange={(value) => onFiltersChange({ ...filters, fund_type_id: value })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Fund Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Fund Types</SelectItem>
          {fundTypes.map((fund) => (
            <SelectItem key={fund.id} value={fund.id}>
              {fund.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
