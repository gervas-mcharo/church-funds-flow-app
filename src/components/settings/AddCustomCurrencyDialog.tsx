
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

export function AddCustomCurrencyDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const { addCustomCurrency, availableCurrencies } = useCurrencySettings();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();

    if (!trimmedCode || !trimmedName || !trimmedSymbol) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (availableCurrencies[trimmedCode]) {
      toast({
        title: "Error",
        description: "Currency code already exists",
        variant: "destructive"
      });
      return;
    }

    if (trimmedCode.length !== 3) {
      toast({
        title: "Error",
        description: "Currency code must be exactly 3 characters",
        variant: "destructive"
      });
      return;
    }

    addCustomCurrency(trimmedCode, {
      name: trimmedName,
      symbol: trimmedSymbol
    });

    toast({
      title: "Success",
      description: `Custom currency ${trimmedCode} added successfully`
    });

    setCode("");
    setName("");
    setSymbol("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Custom Currency
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Currency</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency-code">Currency Code (3 letters)</Label>
            <Input
              id="currency-code"
              placeholder="e.g., XYZ"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency-name">Currency Name</Label>
            <Input
              id="currency-name"
              placeholder="e.g., Example Currency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency-symbol">Currency Symbol</Label>
            <Input
              id="currency-symbol"
              placeholder="e.g., ¤"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Currency</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
