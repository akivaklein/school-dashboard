import { supabase } from '../supabaseClient'
import {
  clearStudentFallbackPatch,
  mergeStudentFallbackPatch,
} from '../utils/studentFallbackCache'

export async function persistStudentFields(id, fields, options = {}) {
  const allowFallback = options.allowFallback !== false

  // Map React field names to database column names
  const mappedFields = { ...fields }
  if ('att' in mappedFields) {
    mappedFields.attendance = mappedFields.att
    delete mappedFields.att
  }
  if ('behaviorLog' in mappedFields) {
    mappedFields.behavior_log = mappedFields.behaviorLog
    delete mappedFields.behaviorLog
  }
  if ('parentCalls' in mappedFields) {
    mappedFields.parent_calls = mappedFields.parentCalls
    delete mappedFields.parentCalls
  }
  if ('testScores' in mappedFields) {
    mappedFields.test_scores = mappedFields.testScores
    delete mappedFields.testScores
  }
  if ('classLog' in mappedFields) {
    mappedFields.class_log = mappedFields.classLog
    delete mappedFields.classLog
  }
  if ('dailyStatus' in mappedFields) {
    mappedFields.daily_status = mappedFields.dailyStatus
    delete mappedFields.dailyStatus
  }
  if ('lateDetails' in mappedFields) {
    mappedFields.late_details = mappedFields.lateDetails
    delete mappedFields.lateDetails
  }
  if ('withStaff' in mappedFields) {
    mappedFields.with_staff = mappedFields.withStaff
    delete mappedFields.withStaff
  }

  const payload = { ...mappedFields }
  const missingColumnPattern = /column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation\s+"?students"?\s+does\s+not\s+exist|could not find the ['"]([a-zA-Z0-9_]+)['"] column of ['"]students['"]/i

  while (true) {
    const { error } = await supabase.from('students').update(payload).eq('id', id)
    if (!error) {
      clearStudentFallbackPatch(id)
      return true
    }

    const message = error.message || ''
    const match = message.match(missingColumnPattern)
    const missingColumn = match?.[1] || match?.[2]

    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]

      if (Object.keys(payload).length === 0) {
        console.error(
          `Supabase student update skipped for ${id}: all requested fields are missing from schema. Original fields:`,
          fields,
          'Last error:',
          error
        )
        return false
      }

      console.warn(
        `Supabase students schema missing column "${missingColumn}". Retrying update for student ${id} with fallback payload keys:`,
        Object.keys(payload)
      )
      continue
    }

    console.error(`Supabase student update failed for ${id}:`, error, 'Payload keys:', Object.keys(payload))

    if (allowFallback) {
      mergeStudentFallbackPatch(id, fields)
      console.warn(`Saved student ${id} changes to local fallback cache due to Supabase write failure.`)
      return true
    }

    return false
  }
}

export async function persistStudentFieldsBulk(updates) {
  const results = await Promise.all(
    updates.map(({ id, fields }) => persistStudentFields(id, fields))
  )
  return results.every(Boolean)
}
