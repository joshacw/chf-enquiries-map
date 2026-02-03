'use client'

import { useState } from 'react'
import { LeadData, LeadSection, LeadField } from '@/lib/lead-api'

interface LeadInfoAccordionProps {
  leadData: LeadData | null
  isLoading: boolean
  error: string | null
}

// Chevron icon component
function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
        isExpanded ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

// Section header component
function SectionHeader({
  label,
  isExpanded,
  onClick,
  fieldCount,
}: {
  label: string
  isExpanded: boolean
  onClick: () => void
  fieldCount: number
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
          {fieldCount} fields
        </span>
      </div>
      <ChevronIcon isExpanded={isExpanded} />
    </button>
  )
}

// Field display component
function FieldDisplay({ field }: { field: LeadField }) {
  const displayValue = field.value || '—'
  const isEmpty = !field.value

  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {field.label}
      </dt>
      <dd className={`mt-1 text-sm ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {displayValue}
      </dd>
    </div>
  )
}

// Section content component
function SectionContent({ section }: { section: LeadSection }) {
  const fields = Object.entries(section.fields)
  const populatedFields = fields.filter(([, field]) => field.value)
  const emptyFields = fields.filter(([, field]) => !field.value)

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      {populatedFields.length > 0 && (
        <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
          {populatedFields.map(([key, field]) => (
            <FieldDisplay key={key} field={field} />
          ))}
        </dl>
      )}
      {emptyFields.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Show {emptyFields.length} empty fields
          </summary>
          <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 mt-2 opacity-60">
            {emptyFields.map(([key, field]) => (
              <FieldDisplay key={key} field={field} />
            ))}
          </dl>
        </details>
      )}
      {populatedFields.length === 0 && emptyFields.length === 0 && (
        <p className="text-sm text-gray-500 italic">No data available</p>
      )}
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-b border-gray-200">
          <div className="px-4 py-3 bg-gray-50">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Error display
function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm text-gray-600">{error}</p>
    </div>
  )
}

// Main accordion section
function AccordionSection({
  sectionKey,
  section,
  isExpanded,
  onToggle,
}: {
  sectionKey: string
  section: LeadSection
  isExpanded: boolean
  onToggle: () => void
}) {
  const fieldCount = Object.values(section.fields).filter(f => f.value).length
  const totalFields = Object.keys(section.fields).length

  return (
    <div>
      <SectionHeader
        label={section.label}
        isExpanded={isExpanded}
        onClick={onToggle}
        fieldCount={fieldCount}
      />
      {isExpanded && <SectionContent section={section} />}
    </div>
  )
}

export default function LeadInfoAccordion({
  leadData,
  isLoading,
  error,
}: LeadInfoAccordionProps) {
  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['contact', 'leadManagement', 'property', 'waterAssessment', 'appointment', 'referrals', 'salesNotes', 'statusFlags'])
  )

  // Toggle section expansion
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionKey)) {
        next.delete(sectionKey)
      } else {
        next.add(sectionKey)
      }
      return next
    })
  }

  // Expand/collapse all
  const expandAll = () => {
    if (leadData) {
      setExpandedSections(new Set(Object.keys(leadData.sections)))
    }
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Lead Information</h2>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Lead Information</h2>
        </div>
        <ErrorDisplay error={error} />
      </div>
    )
  }

  if (!leadData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Lead Information</h2>
        </div>
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          No contact ID provided. Lead data will be loaded when a contact_id is present in the URL.
        </div>
      </div>
    )
  }

  // Define section order
  const sectionOrder: (keyof typeof leadData.sections)[] = [
    'contact',
    'leadManagement',
    'property',
    'waterAssessment',
    'appointment',
    'referrals',
    'salesNotes',
    'statusFlags',
  ]

  const allExpanded = expandedSections.size === sectionOrder.length
  const allCollapsed = expandedSections.size === 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with expand/collapse controls */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Lead Information</h2>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
            ID: {leadData.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            disabled={allExpanded}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              allExpanded
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={collapseAll}
            disabled={allCollapsed}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              allCollapsed
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion sections */}
      <div>
        {sectionOrder.map((sectionKey) => {
          const section = leadData.sections[sectionKey]
          return (
            <AccordionSection
              key={sectionKey}
              sectionKey={sectionKey}
              section={section}
              isExpanded={expandedSections.has(sectionKey)}
              onToggle={() => toggleSection(sectionKey)}
            />
          )
        })}
      </div>
    </div>
  )
}
