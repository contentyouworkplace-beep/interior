export interface AppSettings {
  gstRate: number
  updatedAt: string | null
}

const STORAGE_KEY = 'app_settings_v1'

const defaultSettings: AppSettings = {
  gstRate: 18,
  updatedAt: null,
}

export async function getAppSettings(): Promise<AppSettings> {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw)
    return { ...defaultSettings, ...parsed }
  } catch {
    return defaultSettings
  }
}

export async function updateGstRate(gstRate: number): Promise<AppSettings> {
  const settings: AppSettings = { gstRate, updatedAt: new Date().toISOString() }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }
  return settings
}
