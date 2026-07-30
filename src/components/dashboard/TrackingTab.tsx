import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { StudentLike, StaffMemberLike, AttendanceHistoryEntry } from '../Dashboard'

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

export default function TrackingTab({ s, students, staffMembers, S, HISTORICAL_DATA }: TrackingTabProps) {
  const [period, setPeriod] = useState('today')
  const [drillType, setDrillType] = useState<string | null>(null)
  const student = students.find((x: StudentLike) => x.id === s.id) || s
  const histData: AttendanceHistoryEntry[] = (HISTORICAL_DATA as Record<string | number, AttendanceHistoryEntry[]>)[String(student.id)] || []

  const filterData = () => {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    switch (period) {
      case 'today': return histData.filter((d: AttendanceHistoryEntry) => d.date === today).length > 0 ? histData.filter((d: AttendanceHistoryEntry) => d.date === today) : histData.slice(0, 1)
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
        return histData.filter((d: AttendanceHistoryEntry) => d.date >= weekAgo)
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
        return histData.filter((d: AttendanceHistoryEntry) => d.date >= monthAgo)
      }
      case 'thismonth': return histData.filter((d: AttendanceHistoryEntry) => d.date.startsWith(now.toISOString().slice(0, 7)))
      case 'year': return histData.filter((d: AttendanceHistoryEntry) => d.date.startsWith(new Date().getFullYear().toString()))
      default: return histData
    }
  }

  const data = filterData()
  const totalIn = data.reduce((acc: number, d: AttendanceHistoryEntry) => acc + d.inMins, 0)
  const totalOut = data.reduce((acc: number, d: AttendanceHistoryEntry) => acc + d.outMins, 0)
  const avgPct = data.length > 0 ? Math.round((totalIn / (totalIn + totalOut)) * 100) : 0
  const pctColor = avgPct >= 70 ? '#56765f' : avgPct >= 50 ? '#9a6a2a' : '#9f1239'
  const staffTime: Record<string, number> = {}
  data.forEach((d: AttendanceHistoryEntry) => {
    if (d.staffName) {
      staffTime[d.staffName] = (staffTime[d.staffName] || 0) + d.outMins
    }
  })

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 days' },
    { id: 'month', label: 'Last 30 days' },
    { id: 'thismonth', label: 'This month' },
    { id: 'year', label: 'This year' },
  ]

  const drillOptions = [
    { id: 'in', label: 'Time in building' },
    { id: 'out', label: 'Time out of building' },
    ...data.map((d: AttendanceHistoryEntry) => ({ id: d.date, label: d.date }))
  ]

  const selectedDrill = drillType ? drillOptions.find(option => option.id === drillType) : null

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
        <div style={S.statCard('#4f6687')}>
          <div style={{ fontSize: 11, color: '#64748b' }}>Total time in</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{formatMinutes(totalIn)}</div>
        </div>
        <div style={S.statCard('#9a6a2a')}>
          <div style={{ fontSize: 11, color: '#64748b' }}>Total time out</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{formatMinutes(totalOut)}</div>
        </div>
        <div style={S.statCard(pctColor)}>
          <div style={{ fontSize: 11, color: '#64748b' }}>Avg. presence</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: pctColor }}>{avgPct}%</div>
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
      </div>
      {staffMembers.length > 0 && (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Staff coverage is derived from attendance history entries for this student.
        </div>
      )}
    </div>
  )
}
