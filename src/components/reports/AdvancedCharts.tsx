
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, ComposedChart, Area, AreaChart, ResponsiveContainer } from "recharts";

interface AdvancedChartsProps {
  analytics: any;
}

export function AdvancedCharts({ analytics }: AdvancedChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "#0088FE",
    },
    count: {
      label: "Count",
      color: "#00C49F",
    },
    currentYear: {
      label: "Current Year",
      color: "#0088FE",
    },
    previousYear: {
      label: "Previous Year",
      color: "#82CA9D",
    },
    growthRate: {
      label: "Growth Rate",
      color: "#FF8042",
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trends with Growth Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Trends & Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <ComposedChart data={analytics.trendAnalysis.monthlyTrends}>
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  name === 'amount' ? formatCurrency(Number(value)) : 
                  name === 'growthRate' ? `${Number(value).toFixed(1)}%` : value,
                  name === 'amount' ? 'Amount' : 
                  name === 'growthRate' ? 'Growth Rate' : 'Count'
                ]}
              />
              <Bar yAxisId="left" dataKey="amount" fill="#0088FE" opacity={0.6} />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="growthRate" 
                stroke="#FF8042" 
                strokeWidth={3}
                dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart data={analytics.trendAnalysis.yearOverYearComparison}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [formatCurrency(Number(value)), ""]}
              />
              <Bar dataKey="currentYear" fill="#0088FE" name="Current Year" />
              <Bar dataKey="previousYear" fill="#82CA9D" name="Previous Year" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Contribution Volume Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contribution Volume Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <AreaChart data={analytics.trendAnalysis.monthlyTrends}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [value, "Contributions"]}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#00C49F" 
                fill="#00C49F" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fund Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fund Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart 
              data={analytics.fundTypeAnalysis.performance}
              layout="horizontal"
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="fundType" width={100} />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => [formatCurrency(Number(value)), "Total Amount"]}
              />
              <Bar dataKey="totalAmount" fill="#0088FE" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
