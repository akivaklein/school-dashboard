export type StudentId = number | string

export type StudentLike = {
  id: StudentId
  name?: string
  status?: string
  dailyStatus?: string
  withStaff?: string | number | null
  [key: string]: unknown
}

export type StaffMember = {
  id: string | number
  name?: string
  role?: string
  [key: string]: unknown
}

export type SupportSession = {
  id: number | string
  student_id: StudentId
  student_name: string
  staff_id: string | null
  staff_name: string | null
  service_type: string
  started_at: string
  ended_at: string | null
  return_location: string | null
  notes: string | null
  goal_worked_on: string | null
  student_response: string | null
  follow_up_needed: boolean
}

export type EndSupportSessionInput = {
  returnLocation: string
  notes: string
  goalWorkedOn: string
  studentResponse: string
  followUpNeeded: boolean
}
