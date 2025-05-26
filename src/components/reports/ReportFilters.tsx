
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download } from "lucide-react";
import { ReportFilters as IReportFilters } from "@/pages/Reports";
import { useContributors } from "@/hooks/useContributors";
import { useFundTypes } from "@/hooks/useFundTypes";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, subWeeks, subMonths, subQuarters, subYears } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportFiltersProps {
  filters: IReportFilters;
  onFiltersChange: (filters: IReportFilters) => void;
}

export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const { data: contributors = [] } = useContributors();
  const { data: fundTypes = [] } = useFundTypes();
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const handleReportTypeChange = (type: 'individual' | 'fund-type' | 'summary') => {
    onFiltersChange({ ...filters, reportType: type });
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (range) {
      case 'week':
        startDate = subWeeks(today, 1);
        break;
      case 'month':
        startDate = subMonths(today, 1);
        break;
      case 'quarter':
        startDate = subQuarters(today, 1);
        break;
      case 'year':
        startDate = subYears(today, 1);
        break;
      default:
        return onFiltersChange({ ...filters, dateRange: range as any });
    }

    onFiltersChange({
      ...filters,
      dateRange: range as any,
      startDate,
      endDate
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Report Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={filters.reportType} onValueChange={handleReportTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="individual">Individual History</SelectItem>
                <SelectItem value="fund-type">Fund Type Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.reportType === 'individual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Contributor</label>
              <Select 
                value={filters.contributorId || ""} 
                onValueChange={(value) => onFiltersChange({ ...filters, contributorId: value })}
              >
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
          )}

          {filters.reportType === 'fund-type' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Fund Type</label>
              <Select 
                value={filters.fundTypeId || ""} 
                onValueChange={(value) => onFiltersChange({ ...filters, fundTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map((fundType) => (
                    <SelectItem key={fundType.id} value={fundType.id}>
                      {fundType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => {
                      onFiltersChange({ ...filters, startDate: date });
                      setIsStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => {
                      onFiltersChange({ ...filters, endDate: date });
                      setIsEndDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
