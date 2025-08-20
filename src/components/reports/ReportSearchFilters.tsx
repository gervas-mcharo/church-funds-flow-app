
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SearchFilters {
  searchTerm: string;
  amountMin?: number;
  amountMax?: number;
  fundTypeFilter?: string;
  contributorFilter?: string;
}

interface ReportSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  fundTypes?: Array<{ id: string; name: string }>;
  contributors?: Array<{ id: string; name: string }>;
}

export function ReportSearchFilters({ onFiltersChange, fundTypes = [], contributors = [] }: ReportSearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [fundTypeFilter, setFundTypeFilter] = useState<string>("");
  const [contributorFilter, setContributorFilter] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyFilters = () => {
    onFiltersChange({
      searchTerm,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined,
      fundTypeFilter: fundTypeFilter || undefined,
      contributorFilter: contributorFilter || undefined,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAmountMin("");
    setAmountMax("");
    setFundTypeFilter("");
    setContributorFilter("");
    onFiltersChange({ searchTerm: "" });
  };

  const hasActiveFilters = searchTerm || amountMin || amountMax || fundTypeFilter || contributorFilter;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contributions, contributors, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={applyFilters} size="sm">
            Search
          </Button>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contributor</label>
              <Select value={contributorFilter || "all"} onValueChange={(value) => setContributorFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All contributors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contributors</SelectItem>
                  {contributors.map((contributor) => (
                    <SelectItem key={contributor.id} value={contributor.id}>
                      {contributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fund Type</label>
              <Select value={fundTypeFilter || "all"} onValueChange={(value) => setFundTypeFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All fund types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fund types</SelectItem>
                  {fundTypes.map((fundType) => (
                    <SelectItem key={fundType.id} value={fundType.id}>
                      {fundType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Amount</label>
              <Input
                type="number"
                placeholder="1000.00"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: "{searchTerm}"
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => { setSearchTerm(""); applyFilters(); }}
                />
              </Badge>
            )}
            {contributorFilter && (
              <Badge variant="secondary">
                Contributor: {contributors.find(c => c.id === contributorFilter)?.name}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => { setContributorFilter(""); applyFilters(); }}
                />
              </Badge>
            )}
            {fundTypeFilter && (
              <Badge variant="secondary">
                Fund: {fundTypes.find(f => f.id === fundTypeFilter)?.name}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => { setFundTypeFilter(""); applyFilters(); }}
                />
              </Badge>
            )}
            {(amountMin || amountMax) && (
              <Badge variant="secondary">
                Amount: ${amountMin || '0'} - ${amountMax || '∞'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => { setAmountMin(""); setAmountMax(""); applyFilters(); }}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
