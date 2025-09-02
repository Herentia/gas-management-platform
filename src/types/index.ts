export interface ModuleCard {
  id: string
  title: string
  description: string
  status: 'normal' | 'warning'
  statusText: string
  infoText: string
  icon: string
  targetView: string
}

export interface AlertItem {
  type: 'danger' | 'warning'
  title: string
  location: string
  time: string
}

export interface GasSourceData {
  time: string
  flow: number
  pressure: number
  status: 'normal' | 'warning'
}

export interface ModuleCard {
  id: string
  title: string
  description: string
  status: 'normal' | 'warning'
  statusText: string
  infoText: string
  icon: string
  targetView: string
}

export interface AlertItem {
  type: 'danger' | 'warning'
  title: string
  location: string
  time: string
}
