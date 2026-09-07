export type ParentCall = Record<string, unknown>

export function isOpenParentCall(call: ParentCall): boolean {
  return call.completed !== true && (
    call.outcome === 'Call Needed' ||
    call.callNeeded === true ||
    call.status === 'needed'
  )
}

export function getOpenParentCalls(calls: ParentCall[]): ParentCall[] {
  return calls.filter(isOpenParentCall)
}

export function getCompletedParentCalls(calls: ParentCall[]): ParentCall[] {
  return calls.filter(call => call.completed === true)
}

export function removeParentCall(calls: ParentCall[], index: number): ParentCall[] {
  return calls.filter((_, currentIndex) => currentIndex !== index)
}