
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";

const recentActivities = [
  {
    id: 1,
    type: "contribution",
    description: "John Smith contributed to Building Fund",
    amount: 500,
    time: "2 hours ago",
    status: "completed"
  },
  {
    id: 2,
    type: "request",
    description: "Youth Ministry requested for event supplies",
    amount: 200,
    time: "4 hours ago",
    status: "pending"
  },
  {
    id: 3,
    type: "contribution",
    description: "Mary Johnson contributed to Missions",
    amount: 150,
    time: "6 hours ago",
    status: "completed"
  },
  {
    id: 4,
    type: "approval",
    description: "Building maintenance request approved",
    amount: 1500,
    time: "1 day ago",
    status: "approved"
  },
];

export function RecentActivity() {
  const { formatAmount } = useCurrencySettings();

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {activity.description} - {formatAmount(activity.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
              <Badge 
                variant={activity.status === 'completed' ? 'default' : activity.status === 'approved' ? 'secondary' : 'outline'}
                className="ml-4"
              >
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
