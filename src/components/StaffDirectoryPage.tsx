export default function StaffDirectoryPage({
  S,
  staff,
  therapistOptions,
  supportStaffOptions,
  initials,
}) {
  const mergedStaff = [
    ...staff,
    ...therapistOptions.map((person, index) => ({
      id: `therapist-${index + 1}`,
      name: person.name,
      role: person.specialty || 'Therapist',
    })),
    ...supportStaffOptions.map((person, index) => ({
      id: `support-${index + 1}`,
      name: person.name,
      role: person.staffType || person.service || 'Support',
    })),
  ]

  const uniqueByName = []
  const seenNames = new Set()
  mergedStaff.forEach(member => {
    const key = (member.name || '').toLowerCase()
    if (!key || seenNames.has(key)) return
    seenNames.add(key)
    uniqueByName.push(member)
  })

  function categoryForRole(role = '') {
    const normalized = role.toLowerCase()

    if (
      normalized.includes('menahel') ||
      normalized.includes('mashgiach')
    ) {
      return 'Administration'
    }

    if (
      normalized.includes('teacher') ||
      normalized.includes('rebbe')
    ) {
      return 'Teachers & Rebbeim'
    }

    if (
      normalized.includes('admin') ||
      normalized.includes('office')
    ) {
      return 'Admin / Office'
    }

    if (
      normalized.includes('therap') ||
      normalized.includes('speech') ||
      normalized.includes('ot') ||
      normalized.includes('pt') ||
      normalized.includes('counsel') ||
      normalized.includes('bcba')
    ) {
      return 'Therapists & Clinicians'
    }

    return 'BTs & Support Staff'
  }

  const grouped = {
    Administration: [],
    'Teachers & Rebbeim': [],
    'Admin / Office': [],
    'Therapists & Clinicians': [],
    'BTs & Support Staff': [],
  }

  uniqueByName.forEach(member => {
    const category = categoryForRole(member.role)
    grouped[category].push(member)
  })

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 6px' }}>
          Staff Directory
        </h1>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Grouped by role category for quick staffing visibility.
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {Object.entries(grouped).map(([category, people]) => (
          <div key={category} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#223046' }}>{category}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{people.length} staff</div>
            </div>

            {people.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No staff in this category.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                {people
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((person, index) => (
                    <div key={`${category}-${person.id}-${index}`} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 11px', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={S.avatar(index, 30)}>{initials(person.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{person.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
