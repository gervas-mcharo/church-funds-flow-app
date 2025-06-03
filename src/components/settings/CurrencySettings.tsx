
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCurrencySettings, CURRENCIES, type CurrencyCode } from "@/hooks/useCurrencySettings";
import { DollarSign, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddCustomCurrencyDialog } from "./AddCustomCurrencyDialog";

export function CurrencySettings() {
  const { 
    currency, 
    setCurrency, 
    formatAmount, 
    availableCurrencies, 
    customCurrencies, 
    removeCustomCurrency 
  } = useCurrencySettings();
  const { toast } = useToast();

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    toast({
      title: "Currency Updated",
      description: `Organization currency changed to ${availableCurrencies[newCurrency].name}`
    });
  };

  const handleRemoveCustomCurrency = (code: string) => {
    removeCustomCurrency(code);
    toast({
      title: "Currency Removed",
      description: `Custom currency ${code} has been removed`
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
      <CardContent className="space-y-6">
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
              {Object.keys(customCurrencies).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t">
                    Custom Currencies
                  </div>
                  {Object.entries(customCurrencies).map(([code, info]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{info.symbol}</span>
                        <span>{info.name}</span>
                        <span className="text-gray-500">({code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center pt-2">
          <AddCustomCurrencyDialog />
        </div>

        {Object.keys(customCurrencies).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Currencies</h4>
            <div className="space-y-2">
              {Object.entries(customCurrencies).map(([code, info]) => (
                <div key={code} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{info.symbol}</span>
                    <div>
                      <p className="font-medium">{info.name}</p>
                      <p className="text-sm text-gray-500">{code}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomCurrency(code)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
