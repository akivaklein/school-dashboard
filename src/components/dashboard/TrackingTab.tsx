import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { StudentLike, StaffMemberLike, AttendanceHistoryEntry } from '../Dashboard'
import { DEMO_TRACKING_HISTORY_KEYS_BY_NAME } from '../dashboardData'

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

function formatStatMinutes(total: number) {
  if (total < 60) return `${total} min`
  return formatMinutes(total)
}

function formatDayLabel(isoDate: string) {
  if (!isoDate) return 'Day'
  const parsed = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-US', { weekday: 'short' })
}

function parseTimeToMins(timeText: string) {
  if (!timeText || !timeText.includes(':')) return null
  const [h, m] = timeText.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

type TrackingTabProps = {
  s: StudentLike
  students: StudentLike[]
  staffMembers: StaffMemberLike[]
  S: {
    card: CSSProperties
    statCard: (color: string) => CSSProperties
    badge: (color: string, bg: string) => CSSProperties
  }
  HISTORICAL_DATA: Record<string | number, AttendanceHistoryEntry[]>
}

type TrackingSegment = {
  time: string
  status: 'classroom' | 'therapy' | 'bt-support' | 'hallway' | 'unaccounted' | 'return'
  location: string
  note: string
  staffName?: string
}

const statusLabel: Record<TrackingSegment['status'], string> = {
  classroom: 'Classroom time',
  therapy: 'Therapy pullout',
  'bt-support': 'BT support',
  hallway: 'Hallway transition',
  unaccounted: 'Unaccounted',
  return: 'Returned to class',
}

export function normalizeHistoryEntries(rawHistory: unknown): AttendanceHistoryEntry[] {
  const source = Array.isArray(rawHistory)
    ? rawHistory
    : rawHistory && typeof rawHistory === 'object' && Array.isArray((rawHistory as { entries?: unknown[] }).entries)
      ? (rawHistory as { entries: unknown[] }).entries
      : rawHistory && typeof rawHistory === 'object' && Array.isArray((rawHistory as { history?: unknown[] }).history)
        ? (rawHistory as { history: unknown[] }).history
        : []

  return source
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map(entry => ({
      date: typeof entry.date === 'string' ? entry.date : '',
      inMins: Number(entry.inMins || 0),
      outMins: Number(entry.outMins || 0),
      pct: Number(entry.pct || 0),
      staffName: typeof entry.staffName === 'string' ? entry.staffName : undefined,
      segments: Array.isArray(entry.segments)
        ? entry.segments
          .filter((segment): segment is Record<string, unknown> => !!segment && typeof segment === 'object')
          .map(segment => ({
            time: typeof segment.time === 'string' ? segment.time : '--:--',
            status: typeof segment.status === 'string' && ['classroom', 'therapy', 'bt-support', 'hallway', 'unaccounted', 'return'].includes(segment.status)
              ? segment.status
              : 'classroom',
            location: typeof segment.location === 'string' ? segment.location : 'School',
            note: typeof segment.note === 'string' ? segment.note : '',
            staffName: typeof segment.staffName === 'string' ? segment.staffName : undefined,
          }))
        : [],
    }))
}

export function resolveRawHistory(
  historicalData: Record<string | number, unknown> | undefined | null,
  student: Pick<StudentLike, 'id' | 'name'>,
): unknown {
  if (!historicalData) return undefined

  const directByStringId = historicalData[String(student.id)]
  if (directByStringId) return directByStringId

  const directByNumericId = historicalData[Number(student.id)]
  if (directByNumericId) return directByNumericId

  const normalizedName = String(student.name || '').trim().toLowerCase()
  if (!normalizedName) return undefined

  const historyKey = DEMO_TRACKING_HISTORY_KEYS_BY_NAME[normalizedName]
  if (!historyKey) return undefined

  return historicalData[historyKey]
}

export default function TrackingTab({ s, students, staffMembers, S, HISTORICAL_DATA }: TrackingTabProps) {
  const [period, setPeriod] = useState('today')
  const [drillType, setDrillType] = useState<string | null>(null)
  const student = students.find((x: StudentLike) => x.id === s.id) || s
  const rawHistory = resolveRawHistory(HISTORICAL_DATA as Record<string | number, unknown> | undefined | null, {
    id: student.id,
    name: student.name,
  })
  const histData: AttendanceHistoryEntry[] = normalizeHistoryEntries(rawHistory)

  const filterData = () => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    switch (period) {
      case 'today': return histData.filter((d: AttendanceHistoryEntry) => d.date === today).length > 0 ? histData.filter((d: AttendanceHistoryEntry) => d.date === today) : histData.slice(0, 1)
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
        return histData.filter((d: AttendanceHistoryEntry) => d.date && d.date >= weekAgo)
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
        return histData.filter((d: AttendanceHistoryEntry) => d.date && d.date >= monthAgo)
      }
      case 'thismonth': return histData.filter((d: AttendanceHistoryEntry) => typeof d.date === 'string' && d.date.startsWith(now.toISOString().slice(0, 7)))
      case 'year': return histData.filter((d: AttendanceHistoryEntry) => typeof d.date === 'string' && d.date.startsWith(new Date().getFullYear().toString()))
      case 'all': return histData
      default: return histData
    }
  }

  const data = filterData()
  const totalIn = data.reduce((acc: number, d: AttendanceHistoryEntry) => acc + Number(d.inMins || 0), 0)
  const totalOut = data.reduce((acc: number, d: AttendanceHistoryEntry) => acc + Number(d.outMins || 0), 0)
  const totalTracked = totalIn + totalOut
  const avgPct = data.length > 0 ? Math.round((totalIn / (totalIn + totalOut)) * 100) : 0
  const outPct = totalTracked > 0 ? Math.max(0, 100 - avgPct) : 0
  const pctColor = avgPct >= 70 ? '#56765f' : avgPct >= 50 ? '#9a6a2a' : '#9f1239'
  const staffTime: Record<string, number> = {}
  data.forEach((d: AttendanceHistoryEntry) => {
    if (d.staffName) {
      staffTime[d.staffName] = (staffTime[d.staffName] || 0) + d.outMins
    }
  })
  const lateCount = Number((student as StudentLike & { lateCount?: number }).lateCount || 0) + (student.lateDetails ? 1 : 0)

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 days' },
    { id: 'month', label: 'Last 30 days' },
    { id: 'thismonth', label: 'This month' },
    { id: 'year', label: 'This year' },
    { id: 'all', label: 'All Time' },
  ]

  const selectedDate = drillType && drillType !== 'in' && drillType !== 'out' && drillType !== 'late'
    ? drillType
    : null
  const selectedEntry = selectedDate
    ? data.find(entry => entry.date === selectedDate)
    : data[0]
  const selectedSegments: TrackingSegment[] = Array.isArray((selectedEntry as { segments?: unknown[] } | undefined)?.segments)
    ? ((selectedEntry as { segments?: TrackingSegment[] }).segments || [])
    : []
  const selectedEntryIn = Number(selectedEntry?.inMins || 0)
  const selectedEntryOut = Number(selectedEntry?.outMins || 0)
  const selectedEntryPct = Number(selectedEntry?.pct || 0)

  const selectedSegmentRows = selectedSegments.map((segment, index) => {
    const currentMinutes = parseTimeToMins(segment.time)
    const nextMinutes = index < selectedSegments.length - 1 ? parseTimeToMins(selectedSegments[index + 1].time) : null
    const estimatedDuration = currentMinutes !== null && nextMinutes !== null && nextMinutes >= currentMinutes
      ? nextMinutes - currentMinutes
      : segment.status === 'classroom' || segment.status === 'return'
        ? 10
        : 5
    return {
      ...segment,
      estimatedDuration,
      isInClass: segment.status === 'classroom' || segment.status === 'return',
    }
  })
  const selectedOutStaff = selectedEntry?.staffName || selectedSegments.find(segment => !!segment.staffName)?.staffName || 'No staff noted'

  const metricCards = [
    {
      label: 'In Class',
      value: formatStatMinutes(totalIn),
      caption: 'click for details ->',
      color: '#4b6854',
      bg: '#f4fbf6',
      drillId: 'in',
    },
    {
      label: 'Out of Class',
      value: formatStatMinutes(totalOut),
      caption: 'click for details ->',
      color: '#9f1239',
      bg: '#fff5f7',
      drillId: 'out',
    },
    {
      label: 'Average In Class',
      value: `${avgPct}%`,
      caption: 'click for details ->',
      color: pctColor,
      bg: '#f8f9ff',
      drillId: 'in',
    },
    {
      label: 'Days Tracked',
      value: String(data.length),
      caption: 'click for details ->',
      color: '#6d28d9',
      bg: '#f7f2ff',
      drillId: data[0]?.date || null,
    },
    {
      label: 'Times Late',
      value: String(lateCount),
      caption: 'click for details ->',
      color: '#b45309',
      bg: '#fff7ed',
      drillId: 'late',
    },
  ]

  const staffTimeRows = Object.entries(staffTime).sort((a, b) => b[1] - a[1])
  const maxStaffOut = staffTimeRows.reduce((max, [, mins]) => Math.max(max, mins), 0)

  const selectedSummary = (() => {
    if (!drillType) return 'Select a card or day to open details.'
    if (drillType === 'in') return `${formatMinutes(totalIn)} spent in class during this window.`
    if (drillType === 'out') return `${formatMinutes(totalOut)} spent out of class during this window.`
    if (drillType === 'late') {
      if (lateCount === 0) return 'No late arrivals recorded in the current student profile.'
      return `${lateCount} late arrival note${lateCount === 1 ? '' : 's'} recorded for this student.`
    }
    return `Tracking entry for ${drillType}`
  })()

  const detailHeaderTitle = selectedDate
    ? `${formatDayLabel(selectedDate)} ${selectedDate} - ${student.name}`
    : drillType === 'in'
      ? `Time In Class - ${student.name}`
      : drillType === 'out'
        ? `Time Out Of Class - ${student.name}`
        : drillType === 'late'
          ? `Late Arrivals - ${student.name}`
          : `Tracking Details - ${student.name}`

  const detailAccent = drillType === 'out' ? '#7f1d1d' : drillType === 'late' ? '#92400e' : '#4b6854'

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {periods.map(item => (
          <button
            key={item.id}
            onClick={() => setPeriod(item.id)}
            style={{ ...S.badge(period === item.id ? '#1e293b' : '#64748b', period === item.id ? '#e2e8f0' : '#f8fafc'), cursor: 'pointer' }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {metricCards.map(card => (
          <button
            key={card.label}
            onClick={() => card.drillId && setDrillType(card.drillId)}
            style={{
              ...S.statCard(card.color),
              background: card.bg,
              border: `1px solid ${card.color}22`,
              borderTop: `3px solid ${card.color}`,
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
              borderRadius: 14,
              padding: '12px 14px',
              textAlign: 'center',
              cursor: card.drillId ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 17, color: '#334155', marginTop: 5 }}>{card.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>{card.caption}</div>
          </button>
        ))}
      </div>
      {drillType && (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: detailAccent, color: '#ffffff', padding: '12px 16px' }}>
            <div style={{ fontWeight: 800, fontSize: 21 }}>{detailHeaderTitle}</div>
            <button
              onClick={() => setDrillType(null)}
              style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
              aria-label='Close details'
            >
              x
            </button>
          </div>
          <div style={{ padding: 14, display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ background: '#f1faf4', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 42, lineHeight: 1, color: '#4b6854', fontWeight: 800 }}>{formatStatMinutes(selectedEntryIn)}</div>
                <div style={{ fontSize: 17, color: '#334155', marginTop: 4 }}>In Class</div>
              </div>
              <div style={{ background: '#fff4f6', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 42, lineHeight: 1, color: '#9f1239', fontWeight: 800 }}>{formatStatMinutes(selectedEntryOut)}</div>
                <div style={{ fontSize: 17, color: '#334155', marginTop: 4 }}>Out</div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 42, lineHeight: 1, color: '#6b7280', fontWeight: 800 }}>{selectedEntryPct}%</div>
                <div style={{ fontSize: 17, color: '#334155', marginTop: 4 }}>In Class</div>
              </div>
            </div>
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 16px', textAlign: 'center', fontSize: 22, color: '#334155' }}>
              Out with: <strong style={{ color: '#312e81' }}>{selectedOutStaff}</strong>
            </div>
            <div style={{ fontWeight: 700, color: '#475569', textAlign: 'center', fontSize: 20 }}>Timeline:</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {selectedSegmentRows.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No timeline rows available for this selection.</div>
              ) : selectedSegmentRows.map((segment, index) => (
                <div key={`${segment.time}-${segment.status}-${index}`} style={{ display: 'grid', gridTemplateColumns: '60px 14px minmax(0, 1fr) auto', alignItems: 'start', gap: 8, padding: '9px 4px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: 15 }}>{segment.time}</div>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: segment.isInClass ? '#4b6854' : '#9f1239', marginTop: 6 }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: segment.isInClass ? '#4b6854' : '#9f1239' }}>{segment.note || statusLabel[segment.status]}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{segment.location}{segment.staffName ? ` - ${segment.staffName}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>{segment.estimatedDuration} min</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{ ...S.card, padding: 14 }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, color: '#334155', marginBottom: 12 }}>
          Overall Time Split
        </div>
        <div style={{ height: 16, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${Math.max(0, avgPct)}%`, minWidth: avgPct > 0 ? 4 : 0, height: '100%', background: '#4b6854' }} />
          <div style={{ width: `${Math.max(0, outPct)}%`, minWidth: outPct > 0 ? 4 : 0, height: '100%', background: '#fb7185' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 15, color: '#475569', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />In class: {avgPct}%</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: 999, background: '#dc2626', display: 'inline-block' }} />Out: {outPct}%</span>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 30, color: '#334155', textAlign: 'center' }}>Time Out - By Staff Member</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {staffTimeRows.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No tracking data yet.</div>
          ) : staffTimeRows.map(([name, mins]) => (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 1.1fr) auto', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: 16, color: '#334155', fontWeight: 600 }}>{name}</span>
              <span style={{ height: 8, borderRadius: 999, background: '#ede9fe', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${maxStaffOut > 0 ? Math.max(10, Math.round((mins / maxStaffOut) * 100)) : 0}%`, borderRadius: 999, background: '#7c3aed' }} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{formatStatMinutes(mins)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 30, color: '#334155', textAlign: 'center' }}>Daily Breakdown <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>(click any day for details)</span></div>
        <div style={{ display: 'grid', gap: 8 }}>
          {data.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 12 }}>No drill-down rows available for this day.</div>
          ) : data.map((entry: AttendanceHistoryEntry) => (
            <button
              key={entry.date}
              onClick={() => {
                setDrillType(entry.date)
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(108px, auto) minmax(140px, 1fr) auto auto minmax(130px, auto) auto',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 10,
                background: drillType === entry.date ? '#eef2ff' : '#ffffff',
                border: `1px solid ${drillType === entry.date ? '#818cf8' : '#e2e8f0'}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>{formatDayLabel(entry.date)} {entry.date}</span>
              <span style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.max(6, Number(entry.pct || 0))}%`, borderRadius: 999, background: '#9f1239' }} />
              </span>
              <span style={{ fontSize: 13, color: '#9f1239', fontWeight: 800 }}>{Number(entry.pct || 0)}%</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{formatStatMinutes(Number(entry.inMins || 0))} in / <span style={{ color: '#9f1239', fontWeight: 700 }}>{formatStatMinutes(Number(entry.outMins || 0))} out</span></span>
              <span style={{ fontSize: 12, color: '#6d28d9' }}>{entry.staffName || 'No staff'}</span>
              <span style={{ fontSize: 14, color: '#64748b' }}>-&gt;</span>
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Drill down details</div>
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: 13, color: '#334155' }}>
          {selectedSummary}
        </div>
        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          {selectedSegments.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 12 }}>No drill-down rows available for this day.</div>
          ) : selectedSegments.map((segment, index) => (
            <div key={`${segment.time}-${segment.status}-${index}`} style={{ display: 'grid', gridTemplateColumns: '60px 130px 1fr', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{segment.time}</div>
              <div style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>{statusLabel[segment.status]}</div>
              <div style={{ fontSize: 11.5, color: '#334155' }}>
                <strong>{segment.location}</strong>
                {segment.staffName ? ` · ${segment.staffName}` : ''}
                {segment.note ? ` — ${segment.note}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      {staffMembers.length > 0 && (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Staff coverage is derived from attendance history entries for this student.
        </div>
      )}
    </div>
  )
}
