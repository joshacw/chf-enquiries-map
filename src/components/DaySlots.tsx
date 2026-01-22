'use client'

import { useState, useEffect } from 'react'
import { getDaySlots, DaySlotsResponse, TimeSlot, DayData } from '@/lib/calendar-api'

interface DaySlotsProps {
  postcode: string
  date: string
  dayData: DayData
  onBack: () => void
  onSlotSelect: (date: string, slot: 'AM' | 'PM', timeSlot: TimeSlot) => void
  onError?: (error: string) => void
}

export default function DaySlots({ postcode, date, dayData, onBack, onSlotSelect, onError }: DaySlotsProps) {
  const [loading, setLoading] = useState(false)
  const [slotsData, setSlotsData] = useState<DaySlotsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDaySlots()
  }, [postcode, date])

  const fetchDaySlots = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getDaySlots(postcode, date)
      setSlotsData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load slots'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSlotClick = (slot: TimeSlot) => {
    // Determine AM/PM based on hour
    const period: 'AM' | 'PM' = slot.hour < 12 ? 'AM' : 'PM'
    onSlotSelect(date, period, slot)
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
          onClick={fetchDaySlots}
          className="hs-button hs-button-primary mt-3"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!slotsData) return null

  const { grouped_by_period, total_slots, day_display } = slotsData

  return (
    <div className="hs-dayslots-container">
      {/* Header */}
      <div
        className="hs-dayslots-header"
        style={{ backgroundColor: dayData.color }}
      >
        <button onClick={onBack} className="hs-dayslots-back">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="hs-dayslots-title">
          <span>{dayData.icon} {day_display}</span>
        </div>
        <div className="hs-dayslots-meta">
          <span>{dayData.conversionRate} close rate</span>
        </div>
      </div>

      {/* Slots Content */}
      <div className="hs-dayslots-content">
        {total_slots === 0 ? (
          <div className="hs-dayslots-empty">
            <p>No available slots for this day</p>
          </div>
        ) : (
          <>
            {/* Morning Slots */}
            {grouped_by_period.morning.length > 0 && (
              <SlotPeriod
                title="Morning"
                icon="🌅"
                slots={grouped_by_period.morning}
                accentColor={dayData.color}
                onSlotClick={handleSlotClick}
              />
            )}

            {/* Afternoon Slots */}
            {grouped_by_period.afternoon.length > 0 && (
              <SlotPeriod
                title="Afternoon"
                icon="☀️"
                slots={grouped_by_period.afternoon}
                accentColor={dayData.color}
                onSlotClick={handleSlotClick}
              />
            )}

            {/* Evening Slots */}
            {grouped_by_period.evening.length > 0 && (
              <SlotPeriod
                title="Evening"
                icon="🌙"
                slots={grouped_by_period.evening}
                accentColor={dayData.color}
                onSlotClick={handleSlotClick}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface SlotPeriodProps {
  title: string
  icon: string
  slots: TimeSlot[]
  accentColor: string
  onSlotClick: (slot: TimeSlot) => void
}

function SlotPeriod({ title, icon, slots, accentColor, onSlotClick }: SlotPeriodProps) {
  return (
    <div className="hs-slot-period">
      <div className="hs-slot-period-header">
        <span>{icon} {title}</span>
        <span className="hs-slot-period-count">{slots.length} slots</span>
      </div>
      <div className="hs-slot-period-grid">
        {slots.map((slot) => (
          <button
            key={slot.event_id}
            onClick={() => onSlotClick(slot)}
            className="hs-slot-button"
            style={{ borderColor: accentColor }}
          >
            <span className="hs-slot-time">{slot.time}</span>
            <span className="hs-slot-cta" style={{ color: accentColor }}>
              Book
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
