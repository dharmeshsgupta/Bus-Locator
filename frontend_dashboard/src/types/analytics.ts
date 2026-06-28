export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: string;
}

export interface ETAAnalytics {
  routeId: string;
  averageDelay: number; // in minutes
  accuracyPercentage: number;
  predictions: Array<{ timestamp: string; actual: number; predicted: number }>;
}

export interface OccupancyAnalytics {
  busId: string;
  peakOccupancyTime: string;
  averageUtilization: number;
  history: ChartDataPoint[];
}
