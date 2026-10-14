import type * as service from './shachrisService'

export type ShachrisBackend = Pick<typeof service,
  'loadShachrisSettings' | 'openShachrisSession' | 'saveShachrisRecords' |
  'startShachrisSession' | 'bulkArriveAtShachrisStart' | 'recordShachrisPresenceEvent' |
  'markShachrisMilestone' | 'saveShachrisExpectation' | 'loadShachrisProgression' |
  'loadShachrisStayHistory' | 'saveShachrisStayRequirement' | 'saveShachrisSettings' |
  'saveShachrisLateReason' | 'setShachrisAbsence' | 'confirmShachrisClearance' |
  'loadShachrisStartCorrectionState' | 'correctShachrisStart'
> & {
  undoShachrisArrival?: typeof service.undoShachrisArrival
  endShachrisLiveSession?: typeof service.endShachrisLiveSession
  reopenShachrisLiveSession?: typeof service.reopenShachrisLiveSession
  loadShachrisWeeklyDecisions?: typeof service.loadShachrisWeeklyDecisions
  saveShachrisWeeklyDecision?: typeof service.saveShachrisWeeklyDecision
  supportsSessionRestart?: boolean
  loadShachrisHistory?: typeof service.loadShachrisHistory
  saveShachrisHistoricalDay?: typeof service.saveShachrisHistoricalDay
  loadShachrisDayAudit?: typeof service.loadShachrisDayAudit
  loadAccess: (role: string) => Promise<{ canEdit: boolean; canManage: boolean; canCorrectStart?: boolean }>
}