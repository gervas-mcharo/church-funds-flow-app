// Centralized status color mapping for consistency across the app
export const statusColors = {
  // Pledge statuses
  active: "bg-blue-500",
  upcoming: "bg-gray-500", 
  partially_fulfilled: "bg-yellow-500",
  fulfilled: "bg-green-500",
  overdue: "bg-red-500",
  cancelled: "bg-gray-400",
  
  // Money request statuses
  draft: "bg-gray-400",
  submitted: "bg-blue-500",
  pending_treasurer: "bg-yellow-500",
  pending_hod: "bg-yellow-500", 
  pending_finance_elder: "bg-yellow-500",
  pending_general_secretary: "bg-yellow-500",
  pending_pastor: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  
  // General statuses
  pending: "bg-yellow-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500"
} as const;

export type StatusColorKey = keyof typeof statusColors;

export const getStatusColor = (status: string): string => {
  return statusColors[status as StatusColorKey] || statusColors.info;
};