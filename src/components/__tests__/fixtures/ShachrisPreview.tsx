import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import ShachrisWorkspace from '../../ShachrisWorkspace'
import { secureShachrisBackend } from '../../../services/shachrisService'
import StudentDobEditor from '../../StudentDobEditor'

const students = [
  { id: 1001, name: 'Student Alef', date_of_birth: '2014-11-28', is_active: true, grade: '8' },
  { id: 1002, name: 'Student Beis', date_of_birth: '2013-09-03', is_active: true, grade: '7' },
  { id: 1003, name: 'Student Gimmel', date_of_birth: null, is_active: true, grade: '8' },
]

export default function Fixture() {
  const [dob, setDob] = useState<string | null>(students[0].date_of_birth)
  return <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>{new URLSearchParams(window.location.search).has('dob')
    ? <StudentDobEditor studentId={1001} dob={dob} editable onSaved={setDob} />
    : <ShachrisWorkspace backend={secureShachrisBackend} students={students} classes={[{ id: 'yk-b', name: '7th Grade' }, { id: 'yk-a', name: '8th Grade' }]} primaryClassIdsByStudent={{ 1001: 'yk-b', 1002: 'yk-b', 1003: 'yk-a' }} instructionalGroups={[{ id: 'gemara-8', name: 'Gemara Level 8' }]} instructionalGroupMemberships={[{ group_id: 'gemara-8', student_id: 1001 }, { group_id: 'gemara-8', student_id: 1003 }]} actorName="QA Rebbe" role="admin" onClose={() => {}} />}</main>
}

const browserTestEnabled = (window as Window & { __SHACHRIS_BROWSER_TEST__?: boolean }).__SHACHRIS_BROWSER_TEST__ === true
createRoot(document.getElementById('root')!).render(browserTestEnabled ? <Fixture /> : <p>Automated browser test fixture.</p>)