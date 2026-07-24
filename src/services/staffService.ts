import { supabase } from '../supabaseClient'

export async function loadStaffMembers() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, active')
      .order('name')

    if (error) {
      console.error('Failed to load staff members:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error loading staff members:', error)
    return []
  }
}

export async function getStaffById(id) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, active')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to load staff member:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting staff member:', error)
    return null
  }
}

export async function getStaffByName(name) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, active')
      .eq('name', name)
      .single()

    if (error) {
      console.error('Failed to load staff member:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting staff member by name:', error)
    return null
  }
}

export async function addStaffMember(name, role = 'staff') {
  try {
    const { data, error } = await supabase
      .from('staff')
      .insert([{ name, role, active: true }])
      .select()

    if (error) {
      console.error('Failed to add staff member:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error adding staff member:', error)
    return null
  }
}

export async function updateStaffMember(id, updates) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Failed to update staff member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating staff member:', error)
    return false
  }
}

export async function deleteStaffMember(id) {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete staff member:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return false
  }
}

export async function deactivateStaffMember(id) {
  return updateStaffMember(id, { active: false })
}

export async function reactivateStaffMember(id) {
  return updateStaffMember(id, { active: true })
}
