
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useFundBalanceTrends } from "@/hooks/useFundBalanceTrends";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

const chartConfig = {
  totalContributions: {
    label: "Contributions",
    color: "hsl(var(--chart-1))",
  },
  totalRequests: {
    label: "Requests",
    color: "hsl(var(--chart-2))",
  },
  netChange: {
    label: "Net Change",
    color: "hsl(var(--chart-3))",
  },
};

export function FundBalanceTrends() {
  const { data: trends, isLoading } = useFundBalanceTrends();
  const { formatAmount } = useCurrencySettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading balance trends...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Net Change Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Fund Balance Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatAmount(value, true)} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatAmount(value), ""]}
                />
                <Line
                  type="monotone"
                  dataKey="netChange"
                  stroke="var(--color-netChange)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-netChange)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Contributions vs Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Contributions vs Approved Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatAmount(value, true)} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatAmount(value), ""]}
                />
                <Bar dataKey="totalContributions" fill="var(--color-totalContributions)" />
                <Bar dataKey="totalRequests" fill="var(--color-totalRequests)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
