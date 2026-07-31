import { useMemo, useState } from 'react'

type TestScore = {
  date?: string
  subject?: string
  topic?: string
  score?: number
  maxScore?: number
  type?: string
  enteredBy?: string
  teacher?: string
}

type StudentLike = {
  id: number
  name: string
  className?: string
  division?: string
  testScores?: TestScore[]
}

export default function GradeReportsPage({ S, students }: { S: any; students: StudentLike[] }) {
  const [filterClass, setFilterClass] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('30')

  const classes = useMemo(() => {
    const set = new Set(students.map(s => s.className).filter(Boolean))
    return Array.from(set).sort()
  }, [students])

  const allScores = useMemo(() => {
    return students.flatMap(s =>
      (s.testScores || []).map(score => ({
        ...score,
        studentId: s.id,
        studentName: s.name,
        className: s.className,
        division: s.division,
      }))
    )
  }, [students])

  const subjects = useMemo(() => {
    const set = new Set(allScores.map(s => s.subject).filter(Boolean))
    return Array.from(set).sort()
  }, [allScores])

  const assessmentTypes = useMemo(() => {
    const set = new Set(allScores.map(s => s.type).filter(Boolean))
    return Array.from(set).sort()
  }, [allScores])

  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - Number(dateRange))
    return d.toISOString().slice(0, 10)
  }, [dateRange])

  const filteredScores = useMemo(() => {
    return allScores.filter(s => {
      if (filterClass !== 'all' && s.className !== filterClass) return false
      if (filterSubject !== 'all' && s.subject !== filterSubject) return false
      if (filterType !== 'all' && s.type !== filterType) return false
      if (s.date && s.date < cutoffDate) return false
      return true
    })
  }, [allScores, filterClass, filterSubject, filterType, cutoffDate])

  // Class averages by subject
  const classSubjectAverages = useMemo(() => {
    const groups: Record<string, { total: number; count: number; max: number }> = {}
    filteredScores.forEach(s => {
      if (!s.score || !s.maxScore) return
      const key = `${s.className || 'Unknown'}|${s.subject || 'General'}`
      if (!groups[key]) groups[key] = { total: 0, count: 0, max: 0 }
      groups[key].total += (s.score / s.maxScore) * 100
      groups[key].count += 1
      groups[key].max = Math.max(groups[key].max, (s.score / s.maxScore) * 100)
    })
    return Object.entries(groups).map(([key, val]) => {
      const [className, subject] = key.split('|')
      return { className, subject, avg: Math.round(val.total / val.count), max: Math.round(val.max), count: val.count }
    }).sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject))
  }, [filteredScores])

  // Student trends (top/bottom performers)
  const studentAverages = useMemo(() => {
    const groups: Record<number, { name: string; className?: string; total: number; count: number }> = {}
    filteredScores.forEach(s => {
      if (!s.score || !s.maxScore) return
      if (!groups[s.studentId]) groups[s.studentId] = { name: s.studentName, className: s.className, total: 0, count: 0 }
      groups[s.studentId].total += (s.score / s.maxScore) * 100
      groups[s.studentId].count += 1
    })
    return Object.entries(groups).map(([id, val]) => ({
      id: Number(id),
      name: val.name,
      className: val.className,
      avg: Math.round(val.total / val.count),
      count: val.count,
    })).sort((a, b) => b.avg - a.avg)
  }, [filteredScores])

  function scoreColor(pct: number) {
    if (pct >= 85) return '#16a34a'
    if (pct >= 70) return '#ca8a04'
    return '#dc2626'
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#16243a' }}>Grade &amp; Test Reports</h1>
        <div style={{ fontSize: 12, color: '#64748b' }}>Class averages, subject trends, and student performance overview</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
          <option value="all">All classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
          <option value="all">All subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
          <option value="all">All types</option>
          {assessmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">All time</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { label: 'Total Assessments', value: filteredScores.length },
            { label: 'Students Assessed', value: new Set(filteredScores.map(s => s.studentId)).size },
            { label: 'Subjects', value: new Set(filteredScores.map(s => s.subject).filter(Boolean)).size },
            {
              label: 'Overall Average',
              value: filteredScores.length > 0
                ? `${Math.round(filteredScores.filter(s => s.score && s.maxScore).reduce((sum, s) => sum + (s.score! / s.maxScore!) * 100, 0) / filteredScores.filter(s => s.score && s.maxScore).length)}%`
                : '—',
            },
          ].map(card => (
            <div key={card.label} style={{ ...S.card, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Class × Subject averages */}
        {classSubjectAverages.length > 0 && (
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0f172a' }}>Class Averages by Subject</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Class</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Subject</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Avg</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>High</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {classSubjectAverages.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155' }}>{row.className}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{row.subject}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: scoreColor(row.avg) }}>{row.avg}%</span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>{row.max}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student performance */}
        {studentAverages.length > 0 && (
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0f172a' }}>Student Performance Summary</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Class</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Avg Score</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: '#475569' }}>Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAverages.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155' }}>{student.name}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{student.className || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: scoreColor(student.avg) }}>{student.avg}%</span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{student.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredScores.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
            No grade entries match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}
