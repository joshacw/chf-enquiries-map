'use client'

import { useState, useEffect } from 'react'
import { getCalendarHeatMap, DayData, HeatMapResponse } from '@/lib/calendar-api'

interface CalendarHeatMapProps {
  postcode: string
  onDaySelect: (date: string, dayData: DayData) => void
  onError?: (error: string) => void
}

export default function CalendarHeatMap({ postcode, onDaySelect, onError }: CalendarHeatMapProps) {
  const [loading, setLoading] = useState(false)
  const [heatMapData, setHeatMapData] = useState<HeatMapResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (postcode && postcode.length === 4) {
      fetchHeatMap()
    }
  }, [postcode])

  const fetchHeatMap = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getCalendarHeatMap(postcode, 14)
      setHeatMapData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load availability'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="hs-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center h-full flex flex-col items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--hs-color-danger)' }}>
          {error}
        </p>
        <button
          onClick={fetchHeatMap}
          className="hs-button hs-button-primary mt-3"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!heatMapData) {
    return (
      <div className="flex items-center justify-center p-4 text-center h-full">
        <p style={{ color: 'var(--hs-text-muted)' }} className="text-sm">
          Enter a postcode to view availability
        </p>
      </div>
    )
  }

  const { priority_breakdown, service_area_name, total_slots_available } = heatMapData

  // Combine all days into a flat array for the grid
  const allDays = [
    ...priority_breakdown.critical.days,
    ...priority_breakdown.urgent.days,
    ...priority_breakdown.warm.days,
    ...priority_breakdown.cooling.days,
  ]

  return (
    <div className="hs-heatmap-container">
      {/* Header */}
      <div className="hs-heatmap-header">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--hs-text-secondary)' }}>
            {service_area_name}
          </span>
          <span className="text-xs" style={{ color: 'var(--hs-text-muted)' }}>
            {total_slots_available} slots
          </span>
        </div>
      </div>

      {/* Priority Sections */}
      <div className="hs-heatmap-sections">
        {/* Critical - Today */}
        {priority_breakdown.critical.days.length > 0 && (
          <PrioritySection
            tier={priority_breakdown.critical}
            onDaySelect={onDaySelect}
          />
        )}

        {/* Urgent - 24-48 hours */}
        {priority_breakdown.urgent.days.length > 0 && (
          <PrioritySection
            tier={priority_breakdown.urgent}
            onDaySelect={onDaySelect}
          />
        )}

        {/* Warm - This week */}
        {priority_breakdown.warm.days.length > 0 && (
          <PrioritySection
            tier={priority_breakdown.warm}
            onDaySelect={onDaySelect}
            compact
          />
        )}

        {/* Cooling - Next week */}
        {priority_breakdown.cooling.days.length > 0 && (
          <PrioritySection
            tier={priority_breakdown.cooling}
            onDaySelect={onDaySelect}
            compact
          />
        )}
      </div>

      {/* Legend */}
      <div className="hs-heatmap-legend">
        <div className="hs-legend-item">
          <div className="hs-legend-dot" style={{ backgroundColor: '#DC2626' }} />
          <span>Today ~85%</span>
        </div>
        <div className="hs-legend-item">
          <div className="hs-legend-dot" style={{ backgroundColor: '#F97316' }} />
          <span>Hot ~65%</span>
        </div>
        <div className="hs-legend-item">
          <div className="hs-legend-dot" style={{ backgroundColor: '#F59E0B' }} />
          <span>Warm ~50%</span>
        </div>
        <div className="hs-legend-item">
          <div className="hs-legend-dot" style={{ backgroundColor: '#10B981' }} />
          <span>Cool ~30%</span>
        </div>
      </div>
    </div>
  )
}

interface PrioritySectionProps {
  tier: { label: string; days: DayData[]; total_slots: number }
  onDaySelect: (date: string, dayData: DayData) => void
  compact?: boolean
}

function PrioritySection({ tier, onDaySelect, compact = false }: PrioritySectionProps) {
  if (tier.days.length === 0) return null

  const accentColor = tier.days[0]?.color || '#6B7280'

  return (
    <div className="hs-priority-section">
      <div
        className="hs-priority-header"
        style={{ backgroundColor: accentColor }}
      >
        <span>{tier.days[0]?.icon} {tier.label}</span>
        <span className="hs-priority-slots">{tier.total_slots} slots</span>
      </div>

      {compact ? (
        <div className="hs-priority-grid">
          {tier.days.map((day) => (
            <DayCard key={day.date} day={day} onSelect={onDaySelect} />
          ))}
        </div>
      ) : (
        <div className="hs-priority-list">
          {tier.days.map((day) => (
            <DayRow key={day.date} day={day} onSelect={onDaySelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function DayRow({ day, onSelect }: { day: DayData; onSelect: (date: string, dayData: DayData) => void }) {
  return (
    <button
      onClick={() => onSelect(day.date, day)}
      disabled={day.available_count === 0}
      className="hs-day-row"
    >
      <div className="hs-day-row-info">
        <span className="hs-day-row-date">
          {day.day_name} {day.month_name} {day.day_number}
        </span>
        <span className="hs-day-row-message">{day.message}</span>
      </div>
      <div className="hs-day-row-slots" style={{ color: day.color }}>
        <span className="hs-day-row-count">{day.available_count}</span>
        <span className="hs-day-row-label">slots</span>
      </div>
      <svg className="hs-day-row-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function DayCard({ day, onSelect }: { day: DayData; onSelect: (date: string, dayData: DayData) => void }) {
  return (
    <button
      onClick={() => onSelect(day.date, day)}
      disabled={day.available_count === 0}
      className="hs-day-card"
      style={{
        borderColor: day.color,
        opacity: day.available_count === 0 ? 0.5 : 1
      }}
    >
      <div className="hs-day-card-weekday">{day.day_name}</div>
      <div className="hs-day-card-number">{day.day_number}</div>
      <div className="hs-day-card-slots" style={{ color: day.color }}>
        {day.available_count}
      </div>
    </button>
  )
}
