
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useContributionTrends } from "@/hooks/useContributionTrends";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { useFundTypes } from "@/hooks/useFundTypes";
import { getChartColor } from "@/constants/chartColors";

export function ContributionChart() {
  const { data: chartData = [], isLoading } = useContributionTrends();
  const { formatAmount } = useCurrencySettings();
  const { data: fundTypes = [] } = useFundTypes();

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Monthly Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Monthly Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip content={<CustomTooltip />} />
            {fundTypes.map((fundType, index) => {
              const key = fundType.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return (
                <Bar 
                  key={fundType.id}
                  dataKey={key} 
                  fill={getChartColor(index)} 
                  name={fundType.name} 
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
