import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TrackingTab from '../dashboard/TrackingTab'
import { HISTORICAL_DATA } from '../dashboardData'

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
})
