import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TrackingTab, { resolveRawHistory } from '../dashboard/TrackingTab'
import { DEMO_TRACKING_HISTORY_KEYS_BY_NAME, HISTORICAL_DATA } from '../dashboardData'

function makeStudent(id: number, name: string) {
  return {
    id,
    name,
    points: 0,
    reminders: 0,
    lastWeekReminders: 0,
    att: [],
    breakfast: [],
    status: 'present',
    withStaff: null,
    services: [],
    parentCalls: [],
    notes: [],
    behaviorLog: [],
    testScores: [],
    classLog: [],
    lateDetails: null,
    family: {},
    medical: {},
  } as any
}

describe('TrackingTab', () => {
  it('resolves demo fixture history by student name when IDs differ', () => {
    const raw = resolveRawHistory(HISTORICAL_DATA as any, {
      id: 'supabase-student-xyz',
      name: 'Levitz Avrohom',
    } as any)

    expect(Array.isArray(raw)).toBe(true)
    expect((raw as any[]).length).toBeGreaterThan(0)
  })

  it('exposes name->history key mapping for showcase demo students', () => {
    expect(DEMO_TRACKING_HISTORY_KEYS_BY_NAME['levitz avrohom']).toBe('6')
  })

  it('preserves demo tracking data for Avrohom Levitz', () => {
    const student = makeStudent(6, 'Levitz Avrohom')

    const markup = renderToStaticMarkup(
      <TrackingTab
        s={student}
        students={[student]}
        staffMembers={[]}
        S={{
          card: {},
          statCard: () => ({}),
          badge: () => ({}),
        }}
        HISTORICAL_DATA={HISTORICAL_DATA as any}
      />,
    )

    expect(markup).not.toContain('No tracking data yet.')
    expect(markup).toContain('Yitzi + Ezriel')
    expect(markup).toContain('2h 45m')
    expect(markup).toContain('1h 10m')
    expect(markup).toContain('70%')
    expect(markup).toContain('Therapy pullout')
    expect(markup).toContain('BT support')
    expect(markup).toContain('Unaccounted')
  })

  it('renders rich demo tracking data for another showcase student', () => {
    const student = makeStudent(12, 'Ettlinger Moshe')

    const markup = renderToStaticMarkup(
      <TrackingTab
        s={student}
        students={[student]}
        staffMembers={[]}
        S={{
          card: {},
          statCard: () => ({}),
          badge: () => ({}),
        }}
        HISTORICAL_DATA={HISTORICAL_DATA as any}
      />,
    )

    expect(markup).toContain('Ezriel + Dovid')
    expect(markup).not.toContain('No tracking data yet.')
  })

  it('renders safely for Yair Bloom when history is missing', () => {
    const student = makeStudent(1, 'Yair Bloom')

    const markup = renderToStaticMarkup(
      <TrackingTab
        s={student}
        students={[student]}
        staffMembers={[]}
        S={{
          card: {},
          statCard: () => ({}),
          badge: () => ({}),
        }}
        HISTORICAL_DATA={undefined as any}
      />,
    )

    expect(markup).toContain('No tracking data yet.')
  })

  it('keeps Yair Bloom empty in the demo fixture source', () => {
    expect((HISTORICAL_DATA as Record<string, unknown>)['1']).toBeUndefined()
    expect(DEMO_TRACKING_HISTORY_KEYS_BY_NAME['bloom yair']).toBeUndefined()
  })

  it('renders safely for Yair Bloom when history shape is different', () => {
    const student = makeStudent(1, 'Yair Bloom')

    const markup = renderToStaticMarkup(
      <TrackingTab
        s={student}
        students={[student]}
        staffMembers={[]}
        S={{
          card: {},
          statCard: () => ({}),
          badge: () => ({}),
        }}
        HISTORICAL_DATA={{
          1: {
            entries: [
              {
                date: '2026-07-30',
                inMins: '70',
                outMins: 20,
                staffName: 'Mrs. Goldberg',
              },
            ],
          },
        } as any}
      />,
    )

    expect(markup).toContain('Mrs. Goldberg')
    expect(markup).not.toContain('No tracking data yet.')
  })

  it('renders the classic summary cards and filters for tracking overview', () => {
    const student = makeStudent(2, 'Ari Cohen')

    const markup = renderToStaticMarkup(
      <TrackingTab
        s={student}
        students={[student]}
        staffMembers={[]}
        S={{
          card: {},
          statCard: () => ({}),
          badge: () => ({}),
        }}
        HISTORICAL_DATA={{
          2: [
            {
              date: '2026-07-31',
              inMins: 180,
              outMins: 60,
              pct: 75,
              staffName: 'Mrs. Goldberg',
              segments: [{ time: '09:00', status: 'classroom', location: 'Classroom', note: 'In class' }],
            },
          ],
        } as any}
      />,
    )

    expect(markup).toContain('In Class')
    expect(markup).toContain('Out of Class')
    expect(markup).toContain('Average In Class')
    expect(markup).toContain('Days Tracked')
    expect(markup).toContain('Times Late')
    expect(markup).toContain('All Time')
  })
})
