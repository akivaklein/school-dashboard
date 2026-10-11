import type * as service from './shachrisService'

export type ShachrisBackend = Pick<typeof service,
  'loadShachrisSettings' | 'openShachrisSession' | 'saveShachrisRecords' |
  'startShachrisSession' | 'bulkArriveAtShachrisStart' | 'recordShachrisPresenceEvent' |
  'markShachrisMilestone' | 'saveShachrisExpectation' | 'loadShachrisProgression' |
  'loadShachrisStayHistory' | 'saveShachrisStayRequirement' | 'saveShachrisSettings' |
  'saveShachrisLateReason' | 'setShachrisAbsence' | 'confirmShachrisClearance' |
  'loadShachrisStartCorrectionState' | 'correctShachrisStart'
> & {
  endShachrisLiveSession?: typeof service.endShachrisLiveSession
  supportsSessionRestart?: boolean
  loadShachrisHistory?: typeof service.loadShachrisHistory
  saveShachrisHistoricalDay?: typeof service.saveShachrisHistoricalDay
  loadShachrisDayAudit?: typeof service.loadShachrisDayAudit
  loadAccess: (role: string) => Promise<{ canEdit: boolean; canManage: boolean; canCorrectStart?: boolean }>
}