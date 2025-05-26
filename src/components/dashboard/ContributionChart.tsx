
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { month: "Jan", tithes: 12500, building: 6800, missions: 2400 },
  { month: "Feb", tithes: 13200, building: 7100, missions: 2800 },
  { month: "Mar", tithes: 14800, building: 8200, missions: 3100 },
  { month: "Apr", tithes: 15200, building: 7900, missions: 2900 },
  { month: "May", tithes: 16100, building: 8400, missions: 3400 },
  { month: "Jun", tithes: 15750, building: 8420, missions: 3280 },
];

export function ContributionChart() {
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="tithes" fill="#10b981" name="Tithes & Offerings" />
            <Bar dataKey="building" fill="#3b82f6" name="Building Fund" />
            <Bar dataKey="missions" fill="#8b5cf6" name="Missions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
