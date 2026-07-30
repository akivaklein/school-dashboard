import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import TrackingTab from '../dashboard/TrackingTab'

describe('TrackingTab', () => {
  it('renders safely when history data is missing or malformed', () => {
    const student = {
      id: 1,
      name: 'Yair Bloom',
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
})
