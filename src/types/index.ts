// 通用类型定义
export interface TableDataItem {
  time: string
  flow: number
  pressure: number
  status: '正常' | '异常'
}

export interface FilterForm {
  dateRange: [Date, Date] | null
  gasType: string
  period: 'hour' | 'day' | 'month'
}

export interface TabItem {
  path: string
  name: string
}

export interface ModuleCard {
  title: string
  status: 'normal' | 'warning'
  description: string
  statusText: string
  infoText: string
  icon: string
  route: string
}

export interface AlertItem {
  type: 'danger' | 'warning'
  title: string
  location: string
  time: string
  icon: string
}
