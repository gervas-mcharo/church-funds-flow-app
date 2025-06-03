
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

const fundData = [
  { name: "Tithes & Offerings", amount: 15750, change: "+12%", color: "text-green-600" },
  { name: "Building Fund", amount: 8420, change: "+5%", color: "text-blue-600" },
  { name: "Missions", amount: 3280, change: "+18%", color: "text-purple-600" },
  { name: "Youth Ministry", amount: 1950, change: "-3%", color: "text-orange-600" },
];

export function FundOverviewCards() {
  const { formatAmount } = useCurrencySettings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {fundData.map((fund) => (
        <Card key={fund.name} className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{fund.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatAmount(fund.amount)}
              </span>
              <span className={`text-sm font-medium ${fund.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {fund.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
