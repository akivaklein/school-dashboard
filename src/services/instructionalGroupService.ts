import { supabase } from '../supabaseClient'

export type InstructionalPeriod = { id: string; name: string; daypart: string; sort_order: number; start_time: string; end_time: string; status: 'active' | 'archived' }
export type PhysicalRoom = { id: string; name: string; status: 'active' | 'archived' }
export type InstructionalGroup = { id: string; period_id: string; name: string; subject: string; teacher_name: string; room_id: string | null; status: 'active' | 'archived' }
export type InstructionalGroupMembership = { group_id: string; student_id: number }

export async function loadInstructionalSchedule() {
  const [periods, rooms, groups, memberships] = await Promise.all([
    supabase.from('instructional_periods').select('*').order('sort_order'),
    supabase.from('physical_rooms').select('*').order('name'),
    supabase.from('instructional_groups').select('*').order('created_at'),
    supabase.from('instructional_group_memberships').select('group_id, student_id'),
  ])
  const error = periods.error || rooms.error || groups.error || memberships.error
  if (error) throw error
  return { periods: periods.data as InstructionalPeriod[], rooms: rooms.data as PhysicalRoom[], groups: groups.data as InstructionalGroup[], memberships: memberships.data as InstructionalGroupMembership[] }
}

export async function saveInstructionalPeriod(period: Partial<InstructionalPeriod> & { id: string; name: string }, actor: string) {
  const { data, error } = await supabase.from('instructional_periods').upsert({ ...period, updated_by: actor, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('*').single()
  if (error) throw error
  return data as InstructionalPeriod
}

export async function savePhysicalRoom(room: Partial<PhysicalRoom> & { id: string; name: string }, actor: string) {
  const { data, error } = await supabase.from('physical_rooms').upsert({ ...room, updated_by: actor, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('*').single()
  if (error) throw error
  return data as PhysicalRoom
}

export async function archiveInstructionalPeriod(id: string, actor: string) {
  const { data, error } = await supabase.from('instructional_periods').update({ status: 'archived', updated_by: actor, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as InstructionalPeriod
}

export async function archivePhysicalRoom(id: string, actor: string) {
  const { data, error } = await supabase.from('physical_rooms').update({ status: 'archived', updated_by: actor, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as PhysicalRoom
}

export async function saveInstructionalGroup(group: Partial<InstructionalGroup> & { id: string; period_id: string; name: string }, actor: string) {
  const { data, error } = await supabase.from('instructional_groups').upsert({ ...group, updated_by: actor, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('*').single()
  if (error) throw error
  return data as InstructionalGroup
}

export async function archiveInstructionalGroup(id: string, actor: string) {
  const { data, error } = await supabase.from('instructional_groups').update({ status: 'archived', updated_by: actor, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as InstructionalGroup
}

export async function replaceInstructionalGroupMembers(groupId: string, studentIds: number[], actor: string) {
  const { error: deleteError } = await supabase.from('instructional_group_memberships').delete().eq('group_id', groupId)
  if (deleteError) throw deleteError
  if (!studentIds.length) return
  const { error } = await supabase.from('instructional_group_memberships').insert(studentIds.map(student_id => ({ group_id: groupId, student_id, added_by: actor })))
  if (error) throw error
}