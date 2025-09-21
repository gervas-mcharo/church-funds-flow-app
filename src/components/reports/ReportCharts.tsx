import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { ReportFilters } from "@/pages/Reports";
import { format, parseISO } from "date-fns";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import { getChartColor } from "@/constants/chartColors";
interface ReportChartsProps {
  data: any[];
  filters: ReportFilters;
}
export function ReportCharts({
  data,
  filters
}: ReportChartsProps) {
  const { formatAmount } = useCurrencySettings();

  // Fund type distribution data
  const fundTypeData = data.reduce((acc, contribution) => {
    const fundTypeName = contribution.fund_types?.name || 'Unknown';
    if (!acc[fundTypeName]) {
      acc[fundTypeName] = {
        name: fundTypeName,
        value: 0
      };
    }
    acc[fundTypeName].value += parseFloat(contribution.amount);
    return acc;
  }, {});
  const pieData = Object.values(fundTypeData) as any[];

  // Monthly trend data
  const monthlyData = data.reduce((acc, contribution) => {
    const month = format(parseISO(contribution.contribution_date), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = {
        month,
        amount: 0,
        count: 0
      };
    }
    acc[month].amount += parseFloat(contribution.amount);
    acc[month].count += 1;
    return acc;
  }, {});
  const trendData = Object.values(monthlyData) as any[];
  const chartConfig = {
    amount: {
      label: "Amount",
      color: "#0088FE"
    },
    count: {
      label: "Count",
      color: "#00C49F"
    }
  };
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fund Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fund Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({
              name,
              percent
            }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={getChartColor(index)} />)}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} formatter={value => [formatAmount(Number(value)), "Amount"]} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Contribution Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contribution Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name) => [name === 'amount' ? formatAmount(Number(value)) : value, name === 'amount' ? 'Amount' : 'Count']} />
              <Line type="monotone" dataKey="amount" stroke={getChartColor(0)} strokeWidth={2} dot={{
              fill: getChartColor(0)
            }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fund Type Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Contributions by Fund</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart data={pieData}>
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} formatter={value => [formatAmount(Number(value)), "Amount"]} />
              <Bar dataKey="value" fill={getChartColor(0)} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>;
}