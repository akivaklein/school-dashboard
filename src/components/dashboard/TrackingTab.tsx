import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { StudentLike, StaffMemberLike, AttendanceHistoryEntry } from '../Dashboard'
import { DEMO_TRACKING_HISTORY_KEYS_BY_NAME } from '../dashboardData'

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
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
  const avgPct = data.length > 0 ? Math.round((totalIn / (totalIn + totalOut)) * 100) : 0
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

  const drillOptions = [
    { id: 'in', label: 'Time in building' },
    { id: 'out', label: 'Time out of building' },
    ...data.map((d: AttendanceHistoryEntry) => ({ id: d.date, label: d.date }))
  ]

  const selectedDrill = drillType ? drillOptions.find(option => option.id === drillType) : null
  const selectedDate = selectedDrill && selectedDrill.id !== 'in' && selectedDrill.id !== 'out'
    ? selectedDrill.id
    : null
  const selectedEntry = selectedDate
    ? data.find(entry => entry.date === selectedDate)
    : data[0]
  const selectedSegments: TrackingSegment[] = Array.isArray((selectedEntry as { segments?: unknown[] } | undefined)?.segments)
    ? ((selectedEntry as { segments?: TrackingSegment[] }).segments || [])
    : []

  const metricCards = [
    {
      label: 'In Class',
      value: formatMinutes(totalIn),
      caption: 'time in the building',
      color: '#4f6687',
      bg: '#eef5ff',
    },
    {
      label: 'Out of Class',
      value: formatMinutes(totalOut),
      caption: 'time away from class',
      color: '#9a6a2a',
      bg: '#fff7e8',
    },
    {
      label: 'Average In Class',
      value: `${avgPct}%`,
      caption: 'presence across the window',
      color: pctColor,
      bg: '#f4fff9',
    },
    {
      label: 'Days Tracked',
      value: String(data.length),
      caption: 'entries in view',
      color: '#6d4c41',
      bg: '#f9f0eb',
    },
    {
      label: 'Times Late',
      value: String(lateCount),
      caption: 'late arrival notes',
      color: '#b45309',
      bg: '#fff7ed',
    },
  ]

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
          <div
            key={card.label}
            style={{
              ...S.statCard(card.color),
              background: card.bg,
              border: `1px solid ${card.color}22`,
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
              borderRadius: 14,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{card.caption}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Presence split</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{avgPct}% in class</div>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(6, avgPct)}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${pctColor}, #2563eb)` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span>{formatMinutes(totalIn)} in</span>
          <span>{formatMinutes(totalOut)} out</span>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Staff coverage</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(staffTime).length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No tracking data yet.</div>
          ) : Object.entries(staffTime).map(([name, mins]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: 13, color: '#334155' }}>{name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4b6854' }}>{formatMinutes(mins)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Daily breakdown</div>
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 10,
                background: drillType === entry.date ? '#eef2ff' : '#ffffff',
                border: `1px solid ${drillType === entry.date ? '#818cf8' : '#e2e8f0'}`,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{entry.date}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{formatMinutes(Number(entry.inMins || 0))} in · {formatMinutes(Number(entry.outMins || 0))} out</span>
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Drill down</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {drillOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setDrillType(option.id)}
              style={{ ...S.badge(drillType === option.id ? '#1e293b' : '#64748b', drillType === option.id ? '#e2e8f0' : '#f8fafc'), cursor: 'pointer' }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {selectedDrill ? (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: 13, color: '#334155' }}>
            {selectedDrill.id === 'in' && `${formatMinutes(totalIn)} spent in the building.`}
            {selectedDrill.id === 'out' && `${formatMinutes(totalOut)} spent out of the building.`}
            {selectedDrill.id !== 'in' && selectedDrill.id !== 'out' && `Tracking entry for ${selectedDrill.id}`}
          </div>
        ) : <div style={{ color: '#94a3b8', fontSize: 13 }}>Choose a drill-down view.</div>}
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
