export default function TherapistAssignmentsPage({ S, students, setStudents, THERAPIST_OPTIONS }: any) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#172033' }}>Therapist Assignments</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Assign boys to therapists. Therapists see only their own caseload on login.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {THERAPIST_OPTIONS.map((t: any) => (
              <span key={t.name} style={{ padding: '8px 12px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 800, color: '#334155' }}>
                {t.name}: {students.filter((s: any) => s.assignedTherapist === t.name).length}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'grid', gap: 8 }}>
          {students.map((stu: any) => (
            <div key={stu.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.4fr', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{stu.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{stu.className}</div>
              </div>

              <select value={stu.assignedTherapist || ''} onChange={e => {
                const therapist = e.target.value
                setStudents((prev: any[]) => prev.map(x => x.id === stu.id ? { ...x, assignedTherapist: therapist } : x))
              }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                <option value="">No therapist</option>
                {THERAPIST_OPTIONS.map((t: any) => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>

              <select value={stu.therapyFrequency || ''} onChange={e => {
                const frequency = e.target.value
                setStudents((prev: any[]) => prev.map(x => x.id === stu.id ? { ...x, therapyFrequency: frequency } : x))
              }} style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }}>
                <option value="">No schedule</option>
                <option value="Weekly">Weekly</option>
                <option value="Twice weekly">Twice weekly</option>
                <option value="As needed">As needed</option>
              </select>

              <input value={stu.therapyNotes || ''} onChange={e => {
                const notes = e.target.value
                setStudents((prev: any[]) => prev.map(x => x.id === stu.id ? { ...x, therapyNotes: notes } : x))
              }} placeholder="Therapy note..." style={{ padding: '7px 9px', borderRadius: 7, border: '1px solid #d8dee9', fontSize: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
