import { getSupabase } from './supabase'

export interface DayData {
  date: string
  day_name: string
  day_number: number
  month_name: string
  available_count: number
  priority: string
  label: string
  color: string
  icon: string
  conversionRate: string
  message: string
  priorityScore: number
}

export interface HeatMapResponse {
  region: string
  service_area_name: string
  coverage_description: string
  priority_breakdown: {
    critical: { label: string; days: DayData[]; total_slots: number }
    urgent: { label: string; days: DayData[]; total_slots: number }
    warm: { label: string; days: DayData[]; total_slots: number }
    cooling: { label: string; days: DayData[]; total_slots: number }
  }
  total_slots_available: number
}

export interface TimeSlot {
  event_id: string
  datetime: string
  time: string
  hour: number
  period: 'morning' | 'afternoon' | 'evening'
}

export interface DaySlotsResponse {
  region: string
  service_area_name: string
  date: string
  day_display: string
  total_slots: number
  slots: TimeSlot[]
  grouped_by_period: {
    morning: TimeSlot[]
    afternoon: TimeSlot[]
    evening: TimeSlot[]
  }
}

export async function getCalendarHeatMap(postcode: string, daysAhead: number = 14): Promise<HeatMapResponse> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  const { data, error } = await supabase.functions.invoke('get-calendar-heatmap', {
    body: { postcode: parseInt(postcode), days_ahead: daysAhead }
  })

  if (error) {
    throw new Error(error.message || 'Failed to fetch calendar availability')
  }

  return data as HeatMapResponse
}

export async function getDaySlots(postcode: string, date: string): Promise<DaySlotsResponse> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Supabase client not available')
  }

  const { data, error } = await supabase.functions.invoke('get-day-slots', {
    body: { postcode: parseInt(postcode), date }
  })

  if (error) {
    throw new Error(error.message || 'Failed to fetch day slots')
  }

  return data as DaySlotsResponse
}
