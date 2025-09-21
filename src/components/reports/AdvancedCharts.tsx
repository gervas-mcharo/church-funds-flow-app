
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, ComposedChart, Area, AreaChart, ResponsiveContainer } from "recharts";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { chartColors } from "@/constants/chartColors";

interface AdvancedChartsProps {
  analytics: any;
}

export function AdvancedCharts({ analytics }: AdvancedChartsProps) {
  const { formatAmount } = useCurrencySettings();

  const chartConfig = {
    amount: {
      label: "Amount",
      color: chartColors.primary[0],
    },
    count: {
      label: "Count",
      color: chartColors.primary[1],
    },
    currentYear: {
      label: "Current Year",
      color: chartColors.primary[0],
    },
    previousYear: {
      label: "Previous Year",
      color: chartColors.primary[2],
    },
    growthRate: {
      label: "Growth Rate",
      color: chartColors.primary[3],
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
                  name === 'amount' ? formatAmount(Number(value)) : 
                  name === 'growthRate' ? `${Number(value).toFixed(1)}%` : value,
                  name === 'amount' ? 'Amount' : 
                  name === 'growthRate' ? 'Growth Rate' : 'Count'
                ]}
              />
              <Bar yAxisId="left" dataKey="amount" fill={chartColors.primary[0]} opacity={0.6} />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="growthRate" 
                stroke={chartColors.primary[3]} 
                strokeWidth={3}
                dot={{ fill: chartColors.primary[3], strokeWidth: 2, r: 4 }}
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
                formatter={(value) => [formatAmount(Number(value)), ""]}
              />
              <Bar dataKey="currentYear" fill={chartColors.primary[0]} name="Current Year" />
              <Bar dataKey="previousYear" fill={chartColors.primary[2]} name="Previous Year" />
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
                stroke={chartColors.primary[1]} 
                fill={chartColors.primary[1]} 
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
                formatter={(value) => [formatAmount(Number(value)), "Total Amount"]}
              />
              <Bar dataKey="totalAmount" fill={chartColors.primary[0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
