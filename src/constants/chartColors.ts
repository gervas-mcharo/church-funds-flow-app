// Centralized chart color management with theme-aware colors
export const chartColors = {
  primary: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'],
  secondary: ['#8DD1E1', '#D084D0', '#FF9F43', '#00D4AA', '#B794F6', '#FBB040'],
  status: {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280'
  },
  trends: {
    up: '#10B981',
    down: '#EF4444',
    stable: '#6B7280'
  }
};

export const getChartColor = (index: number, palette: 'primary' | 'secondary' = 'primary'): string => {
  return chartColors[palette][index % chartColors[palette].length];
};

export const getStatusColor = (status: keyof typeof chartColors.status): string => {
  return chartColors.status[status];
};

export const getTrendColor = (trend: keyof typeof chartColors.trends): string => {
  return chartColors.trends[trend];
};