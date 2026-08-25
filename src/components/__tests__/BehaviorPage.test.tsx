import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BehaviorPage, { buildManualPointAdjustmentPayload, resolveManualPointReason } from '../BehaviorPage'

const styleHelpers = {
  btn: () => ({}),
  badge: () => ({}),
  card: {},
  avatar: () => ({}),
}

const students = [
  { id: 1, name: 'Avi Cohen', points: 42, reminders: 0 },
  { id: 2, name: 'Beni Levy', points: 18, reminders: 1 },
]

describe('BehaviorPage manual points controls', () => {
  it('keeps bulk points collapsed and shows fast signed manual entry with required reasons', () => {
    const markup = renderToStaticMarkup(
      <BehaviorPage
        students={students}
        searchedStudents={students}
        openStudent={() => {}}
        initials={(name: string) => name.slice(0, 1)}
        isVIP={() => false}
        S={styleHelpers}
        statusColor={() => '#000'}
        statusEmoji={() => ''}
        statusLabel={() => ''}
        onAdjustPoints={async () => true}
      />,
    )

    expect(markup).toContain('Fast Manual Points')
    expect(markup).toContain('Daily entries')
    expect(markup).toContain('Fixing')
    expect(markup).toContain('Random')
    expect(markup).toContain('Other')
    expect(markup).toContain('+/- pts')
    expect(markup).toContain('Show Bulk Points')
    expect(markup).not.toContain('Select Visible')
  })

  it('builds positive and negative manual adjustments with reason logging separate from behavior', () => {
    expect(resolveManualPointReason('Other', 'Keyboard correction')).toBe('Keyboard correction')

    const positivePayload = buildManualPointAdjustmentPayload({
      studentId: 1,
      pointsDelta: 37,
      reason: 'Daily entries',
      reasonType: 'Daily entries',
      sourceContext: 'points-page-manual-adjustment',
    })
    const negativePayload = buildManualPointAdjustmentPayload({
      studentId: 1,
      pointsDelta: -20,
      reason: 'Fixing',
      reasonType: 'Fixing',
      sourceContext: 'points-page-manual-adjustment',
    })

    expect(positivePayload).toMatchObject({ pointsDelta: 37, reason: 'Daily entries', eventType: 'adjustment', category: 'manual', reminderDelta: 0 })
    expect(negativePayload).toMatchObject({ pointsDelta: -20, reason: 'Fixing', eventType: 'adjustment', category: 'manual', reminderDelta: 0 })
  })
})
