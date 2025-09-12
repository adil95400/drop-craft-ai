// Types personnalisés pour les graphiques Recharts
export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: any
    name: string
    dataKey: string
    color?: string
    payload?: any
    [key: string]: any
  }>
  label?: any
  percent?: number
  category?: string
  count?: number
  range?: string
  country?: string
  percentage?: number
  region?: string
  usage?: number
}

export interface ChartLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
  index?: number
  value?: any
  name?: string
  category?: string
  count?: number
  range?: string
  country?: string
  percentage?: number
  region?: string
  usage?: number
}

// Type helper pour les données de graphique
export interface ChartDataPoint {
  [key: string]: any
  percent?: number
  category?: string
  count?: number
  range?: string
  country?: string
  percentage?: number
  region?: string
  usage?: number
}