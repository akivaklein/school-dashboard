import { supabase } from '../supabaseClient'

export type DaveningSection = { id: string; label: string }
export type DaveningRating = { id: string; code: string; label: string }

export type DaveningTemplate = {
  id: string
  name: string
  title: string
  show_numbering: boolean
  sections: DaveningSection[]
  ratings: DaveningRating[]
  created_at: string
  updated_at: string
}

export type DaveningChecklist = {
  id: string
  template_id: string | null
  checklist_date: string
  scope_type: 'class' | 'group'
  scope_id: string
  scope_label: string
  title: string
  sections: DaveningSection[]
  ratings: DaveningRating[]
  created_by_name: string
  created_at: string
  updated_at: string
}

export type DaveningMark = {
  checklist_id: string
  student_id: number
  section_id: string
  rating_id: string
  updated_by_name: string
  updated_at?: string
}

export type DaveningHistoryRow = DaveningMark & {
  davening_checklists: Pick<DaveningChecklist, 'id' | 'checklist_date' | 'title' | 'scope_label' | 'sections' | 'ratings'>
}

export async function loadDaveningTemplates(): Promise<DaveningTemplate[]> {
  const { data, error } = await supabase.from('davening_templates').select('*').order('name')
  if (error) throw error
  return (data || []) as DaveningTemplate[]
}

export async function saveDaveningTemplate(template: Pick<DaveningTemplate, 'name' | 'title' | 'show_numbering' | 'sections' | 'ratings'> & { id?: string }): Promise<DaveningTemplate> {
  const { data, error } = await supabase
    .from('davening_templates')
    .upsert({ ...template, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select('*')
    .single()
  if (error) throw error
  return data as DaveningTemplate
}

export async function renameDaveningTemplate(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('davening_templates').update({ name, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteDaveningTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('davening_templates').delete().eq('id', id)
  if (error) throw error
}

export async function openDaveningChecklist(input: {
  template: DaveningTemplate
  checklistDate: string
  scopeType: 'class' | 'group'
  scopeId: string
  scopeLabel: string
  actorName: string
}): Promise<{ checklist: DaveningChecklist; marks: DaveningMark[] }> {
  const { data: existing, error: findError } = await supabase
    .from('davening_checklists')
    .select('*')
    .eq('template_id', input.template.id)
    .eq('checklist_date', input.checklistDate)
    .eq('scope_type', input.scopeType)
    .eq('scope_id', input.scopeId)
    .maybeSingle()
  if (findError) throw findError

  let checklist = existing as DaveningChecklist | null
  if (!checklist) {
    const { data, error } = await supabase
      .from('davening_checklists')
      .insert({
        template_id: input.template.id,
        checklist_date: input.checklistDate,
        scope_type: input.scopeType,
        scope_id: input.scopeId,
        scope_label: input.scopeLabel,
        title: input.template.title,
        sections: input.template.sections,
        ratings: input.template.ratings,
        created_by_name: input.actorName,
      })
      .select('*')
      .single()
    if (error) throw error
    checklist = data as DaveningChecklist
  }

  const { data: marks, error: marksError } = await supabase.from('davening_marks').select('*').eq('checklist_id', checklist.id)
  if (marksError) throw marksError
  return { checklist, marks: (marks || []) as DaveningMark[] }
}

export async function saveDaveningMarks(checklistId: string, marks: DaveningMark[]): Promise<void> {
  if (!marks.length) return
  const { error } = await supabase
    .from('davening_marks')
    .upsert(marks.map(mark => ({ ...mark, checklist_id: checklistId, updated_at: new Date().toISOString() })), { onConflict: 'checklist_id,student_id,section_id' })
  if (error) throw error
}

export async function loadStudentDaveningHistory(studentId: number): Promise<DaveningHistoryRow[]> {
  const { data, error } = await supabase
    .from('davening_marks')
    .select('*, davening_checklists!inner(id, checklist_date, title, scope_label, sections, ratings)')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []) as DaveningHistoryRow[]
}
