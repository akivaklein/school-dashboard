import type * as service from './shachrisService'

export type ShachrisBackend = Pick<typeof service,
  'loadShachrisSettings' | 'openShachrisSession' | 'saveShachrisRecords' |
  'startShachrisSession' | 'bulkArriveAtShachrisStart' | 'recordShachrisPresenceEvent' |
  'markShachrisMilestone' | 'saveShachrisExpectation' | 'loadShachrisProgression' |
  'loadShachrisStayHistory' | 'saveShachrisStayRequirement' | 'saveShachrisSettings' |
  'saveShachrisLateReason' | 'setShachrisAbsence' | 'confirmShachrisClearance' |
  'loadShachrisStartCorrectionState' | 'correctShachrisStart'
> & {
  loadAccess: (role: string) => Promise<{ canEdit: boolean; canManage: boolean; canCorrectStart?: boolean }>
}