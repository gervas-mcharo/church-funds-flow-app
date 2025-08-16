import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { DollarSign, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddCustomCurrencyDialog } from "./AddCustomCurrencyDialog";

export function CurrencySettings() {
  const { 
    currency, 
    setCurrency, 
    formatAmount, 
    availableCurrencies, 
    currencies, 
    removeCurrency,
    isLoading
  } = useCurrencySettings();
  const { toast } = useToast();

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await setCurrency(newCurrency);
      const currencyInfo = availableCurrencies.find(c => c.currency_code === newCurrency);
      toast({
        title: "Currency Updated",
        description: `Organization currency changed to ${currencyInfo?.currency_name || newCurrency}`
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCurrency = async (code: string) => {
    try {
      await removeCurrency(code);
      toast({
        title: "Currency Removed",
        description: `Currency ${code} has been removed`
      });
    } catch (error) {
      console.error('Error removing currency:', error);
      toast({
        title: "Error",
        description: "Failed to remove currency",
        variant: "destructive"
      });
    }
  };

  const currentCurrency = availableCurrencies.find(c => c.currency_code === currency);

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Organization Currency
          </label>
          <Select value={currency} onValueChange={handleCurrencyChange} disabled={isLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency">
                {currentCurrency ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{currentCurrency.currency_symbol}</span>
                    <span>{currentCurrency.currency_name}</span>
                    <span className="text-gray-500">({currentCurrency.currency_code})</span>
                  </div>
                ) : (
                  "Select currency"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((curr) => (
                <SelectItem key={curr.currency_code} value={curr.currency_code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{curr.currency_symbol}</span>
                    <span>{curr.currency_name}</span>
                    <span className="text-gray-500">({curr.currency_code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center pt-2">
          <AddCustomCurrencyDialog />
        </div>

        {availableCurrencies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">All Currencies</h4>
            <div className="space-y-2">
              {availableCurrencies.map((curr) => (
                <div key={curr.currency_code} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{curr.currency_symbol}</span>
                    <div>
                      <p className="font-medium">{curr.currency_name}</p>
                      <p className="text-sm text-gray-500">{curr.currency_code}</p>
                    </div>
                  </div>
                  {curr.currency_code !== currency && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCurrency(curr.currency_code)}
                      className="text-red-600 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
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