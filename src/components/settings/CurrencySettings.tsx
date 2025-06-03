
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrencySettings, CURRENCIES, type CurrencyCode } from "@/hooks/useCurrencySettings";
import { DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CurrencySettings() {
  const { currency, setCurrency, formatAmount } = useCurrencySettings();
  const { toast } = useToast();

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    toast({
      title: "Currency Updated",
      description: `Organization currency changed to ${CURRENCIES[newCurrency].name}`
    });
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Organization Currency
          </label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <SelectItem key={code} value={code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{info.symbol}</span>
                    <span>{info.name}</span>
                    <span className="text-gray-500">({code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 mb-1">Sample amounts will display as:</p>
            <div className="space-y-1">
              <p className="font-mono">{formatAmount(1000)} (One thousand)</p>
              <p className="font-mono">{formatAmount(25.50)} (Twenty-five and fifty cents)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
