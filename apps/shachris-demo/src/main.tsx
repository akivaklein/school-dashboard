import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RotateCcw } from 'lucide-react'
import ShachrisWorkspace from '../../../src/components/ShachrisWorkspace'
import { createShachrisDemoBackend } from './demoBackend'
import { demoRoster, rosterSnapshotDate } from './roster'
import './shell.css'

const backend = createShachrisDemoBackend(demoRoster)
const primaryClassIdsByStudent = Object.fromEntries(demoRoster.map(student => [student.id, student.classId]))

createRoot(document.getElementById('root')!).render(<StrictMode>
  <div className="demo-notice"><strong>Temporary Demo</strong><span>Simulated session - no school records changed</span><span>Roster snapshot {rosterSnapshotDate}</span><button title="Reset demo session" aria-label="Reset demo session" onClick={() => window.location.reload()}><RotateCcw size={17} /></button></div>
  <main className="demo-main"><ShachrisWorkspace backend={backend} liveOnly students={demoRoster} classes={[{ id: 'yk-b', name: '7th Grade' }, { id: 'yk-a', name: '8th Grade' }]} primaryClassIdsByStudent={primaryClassIdsByStudent} instructionalGroups={[]} instructionalGroupMemberships={[]} actorName="Demo visitor" role="demo" /></main>
</StrictMode>)