
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentActivities = [
  {
    id: 1,
    type: "contribution",
    description: "John Smith contributed $500 to Building Fund",
    time: "2 hours ago",
    status: "completed"
  },
  {
    id: 2,
    type: "request",
    description: "Youth Ministry requested $200 for event supplies",
    time: "4 hours ago",
    status: "pending"
  },
  {
    id: 3,
    type: "contribution",
    description: "Mary Johnson contributed $150 to Missions",
    time: "6 hours ago",
    status: "completed"
  },
  {
    id: 4,
    type: "approval",
    description: "Building maintenance request approved - $1,500",
    time: "1 day ago",
    status: "approved"
  },
];

export function RecentActivity() {
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
                <p className="text-sm text-gray-900">{activity.description}</p>
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
