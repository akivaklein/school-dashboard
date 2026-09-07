import { useMemo, useState } from 'react'
import { archiveInstructionalGroup, archiveInstructionalPeriod, archivePhysicalRoom, replaceInstructionalGroupMembers, saveInstructionalGroup, saveInstructionalPeriod, savePhysicalRoom, type InstructionalGroup, type InstructionalGroupMembership, type InstructionalPeriod, type PhysicalRoom } from '../services/instructionalGroupService'
import { findInstructionalGroupConflict } from '../utils/instructionalGroupUtils'

export default function SetupInstructionalGroupsSection({ S, students = [], staffMembers = [], periods, rooms, groups, memberships, actorName, onChanged }) {
  const [periodDraft, setPeriodDraft] = useState({ name: '', daypart: 'Morning', start_time: '', end_time: '' })
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null)
  const [roomDraft, setRoomDraft] = useState('')
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [groupDraft, setGroupDraft] = useState({ period_id: '', name: '', subject: '', teacher_name: '', room_id: '' })
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const activePeriods = periods.filter(period => period.status === 'active')
  const activeRooms = rooms.filter(room => room.status === 'active')
  const activeGroups = groups.filter(group => group.status === 'active')
  const filteredStudents = useMemo(() => students.filter(student => String(student.name || '').toLowerCase().includes(studentSearch.toLowerCase())), [students, studentSearch])

  async function addPeriod() {
    if (!periodDraft.name.trim()) return
    const saved = await saveInstructionalPeriod({ id: editingPeriodId || `period-${Date.now()}`, ...periodDraft, sort_order: activePeriods.length + 1, status: 'active' }, actorName)
    onChanged({ period: saved })
    setPeriodDraft({ name: '', daypart: 'Morning', start_time: '', end_time: '' })
    setEditingPeriodId(null)
  }

  async function addRoom() {
    if (!roomDraft.trim()) return
    const saved = await savePhysicalRoom({ id: editingRoomId || `room-${Date.now()}`, name: roomDraft.trim(), status: 'active' }, actorName)
    onChanged({ room: saved })
    setRoomDraft('')
    setEditingRoomId(null)
  }

  async function saveGroup() {
    if (!groupDraft.period_id || !groupDraft.name.trim()) return
    const conflictingStudent = findInstructionalGroupConflict(selectedStudents, groupDraft.period_id, groups, memberships, editingGroupId)
    if (conflictingStudent) {
      alert('A student can only belong to one instructional group in the same period.')
      return
    }
    const saved = await saveInstructionalGroup({ id: editingGroupId || `group-${Date.now()}`, ...groupDraft, room_id: groupDraft.room_id || null, status: 'active' }, actorName)
    await replaceInstructionalGroupMembers(saved.id, selectedStudents, actorName)
    onChanged({ group: saved, memberships: selectedStudents.map(student_id => ({ group_id: saved.id, student_id })) })
    setGroupDraft({ period_id: groupDraft.period_id, name: '', subject: '', teacher_name: '', room_id: '' })
    setSelectedStudents([])
    setEditingGroupId(null)
  }

  async function archiveGroup(group: InstructionalGroup) {
    if (!window.confirm(`Archive ${group.name}?`)) return
    const saved = await archiveInstructionalGroup(group.id, actorName)
    onChanged({ group: saved })
  }

  async function editGroup(group: InstructionalGroup) {
    setEditingGroupId(group.id)
    setGroupDraft({ period_id: group.period_id, name: group.name, subject: group.subject, teacher_name: group.teacher_name, room_id: group.room_id || '' })
    setSelectedStudents(memberships.filter(member => member.group_id === group.id).map(member => member.student_id))
  }

  async function copyGroup(group: InstructionalGroup, targetPeriodId: string) {
    if (!targetPeriodId || targetPeriodId === group.period_id) return
    const copy = await saveInstructionalGroup({ ...group, id: `group-${Date.now()}`, period_id: targetPeriodId, name: `${group.name} Copy` }, actorName)
    const studentIds = memberships.filter(member => member.group_id === group.id).map(member => member.student_id)
    await replaceInstructionalGroupMembers(copy.id, studentIds, actorName)
    onChanged({ group: copy, memberships: studentIds.map(student_id => ({ group_id: copy.id, student_id })) })
  }

  return <div style={{ display: 'grid', gap: 14 }}>
    <div style={{ ...S.card, padding: 16 }}><h3 style={{ margin: 0, color: '#102a43' }}>Periods and Physical Rooms</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px auto', gap: 8, marginTop: 10 }}><input placeholder="Period name" value={periodDraft.name} onChange={event => setPeriodDraft({ ...periodDraft, name: event.target.value })} /><select value={periodDraft.daypart} onChange={event => setPeriodDraft({ ...periodDraft, daypart: event.target.value })}><option>Morning</option><option>Afternoon</option></select><input placeholder="Start" value={periodDraft.start_time} onChange={event => setPeriodDraft({ ...periodDraft, start_time: event.target.value })} /><input placeholder="End" value={periodDraft.end_time} onChange={event => setPeriodDraft({ ...periodDraft, end_time: event.target.value })} /><button onClick={addPeriod} style={S.btn('primary')}>{editingPeriodId ? 'Save Period' : 'Add Period'}</button></div><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input placeholder="Physical room name" value={roomDraft} onChange={event => setRoomDraft(event.target.value)} /><button onClick={addRoom} style={S.btn('ghost')}>{editingRoomId ? 'Save Room' : 'Add Room'}</button></div><div style={{ display: 'grid', gap: 5, marginTop: 10 }}>{activePeriods.map(period => <div key={period.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={S.tag('#536579', '#eef2f6')}>{period.daypart} · {period.name}</span><button onClick={() => { setEditingPeriodId(period.id); setPeriodDraft({ name: period.name, daypart: period.daypart, start_time: period.start_time, end_time: period.end_time }) }} style={S.btn('ghost')}>Edit</button><button onClick={async () => onChanged({ period: await archiveInstructionalPeriod(period.id, actorName) })} style={S.btn('ghost')}>Archive</button></div>)}{activeRooms.map(room => <div key={room.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={S.tag('#3f6b76', '#e8f4f3')}>Room · {room.name}</span><button onClick={() => { setEditingRoomId(room.id); setRoomDraft(room.name) }} style={S.btn('ghost')}>Edit</button><button onClick={async () => onChanged({ room: await archivePhysicalRoom(room.id, actorName) })} style={S.btn('ghost')}>Archive</button></div>)}</div></div>
    <div style={{ ...S.card, padding: 16 }}><h3 style={{ margin: 0, color: '#102a43' }}>Add Instructional Group</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}><select value={groupDraft.period_id} onChange={event => setGroupDraft({ ...groupDraft, period_id: event.target.value })}><option value="">Period</option>{activePeriods.map(period => <option key={period.id} value={period.id}>{period.daypart} · {period.name}</option>)}</select><input placeholder="Group name" value={groupDraft.name} onChange={event => setGroupDraft({ ...groupDraft, name: event.target.value })} /><input placeholder="Subject" value={groupDraft.subject} onChange={event => setGroupDraft({ ...groupDraft, subject: event.target.value })} /><select value={groupDraft.teacher_name} onChange={event => setGroupDraft({ ...groupDraft, teacher_name: event.target.value })}><option value="">Teacher</option>{staffMembers.filter(staff => ['teacher', 'rebbe'].includes(String(staff.role || '').toLowerCase())).map(staff => <option key={staff.id} value={staff.name}>{staff.name}</option>)}</select><select value={groupDraft.room_id} onChange={event => setGroupDraft({ ...groupDraft, room_id: event.target.value })}><option value="">Room</option>{activeRooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></div><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input placeholder="Search students" value={studentSearch} onChange={event => setStudentSearch(event.target.value)} /><button onClick={saveGroup} style={S.btn('primary')}>Save Group</button></div><div style={{ maxHeight: 150, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginTop: 8 }}>{filteredStudents.map(student => <label key={student.id} style={{ fontSize: 11 }}><input type="checkbox" checked={selectedStudents.includes(Number(student.id))} onChange={() => setSelectedStudents(current => current.includes(Number(student.id)) ? current.filter(id => id !== Number(student.id)) : [...current, Number(student.id)])} /> {student.name}</label>)}</div></div>
    <div style={{ display: 'grid', gap: 8 }}>{activeGroups.map(group => { const period = periods.find(item => item.id === group.period_id); const room = rooms.find(item => item.id === group.room_id); const memberCount = memberships.filter(member => member.group_id === group.id).length; return <div key={group.id} style={{ ...S.card, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}><div><b>{group.name}</b><div style={{ color: '#64748b', fontSize: 11 }}>{period?.daypart} · {period?.name} · {group.subject || 'General'} · {group.teacher_name || 'No teacher'} · {room?.name || 'No room'} · {memberCount} students</div></div><div style={{ display: 'flex', gap: 6 }}><button onClick={() => editGroup(group)} style={S.btn('ghost')}>Edit</button><select defaultValue="" onChange={event => { void copyGroup(group, event.target.value); event.currentTarget.value = '' }}><option value="">Copy to...</option>{activePeriods.filter(item => item.id !== group.period_id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => archiveGroup(group)} style={S.btn('ghost')}>Archive</button></div></div> })}</div>
  </div>
}