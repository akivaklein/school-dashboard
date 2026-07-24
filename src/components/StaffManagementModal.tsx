import React, { useState, useEffect } from 'react'
import { loadStaffMembers, updateStaffMember, deactivateStaffMember, reactivateStaffMember } from '../services/staffService'

interface StaffMember {
  id: number
  name: string
  role: string
  active: boolean
  created_at?: string
}

interface StaffManagementModalProps {
  onClose: () => void
}

export default function StaffManagementModal({ onClose }: StaffManagementModalProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingRole, setEditingRole] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    setLoading(true)
    const members = await loadStaffMembers()
    setStaff(members)
    setLoading(false)
  }

  async function handleUpdateRole(id: number, newRole: string) {
    await updateStaffMember(id, { role: newRole })
    setEditingId(null)
    await loadStaff()
  }

  async function handleToggleActive(id: number, currentActive: boolean) {
    if (currentActive) {
      await deactivateStaffMember(id)
    } else {
      await reactivateStaffMember(id)
    }
    await loadStaff()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.42)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 700,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 70px rgba(15,23,42,0.22)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#0f172a',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>👥 Staff Management</div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: 28,
              height: 28,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading staff...</div>
          ) : staff.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No staff members</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 0.8fr 0.6fr',
                  gap: 12,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 8,
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                <div>Name</div>
                <div>Role</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {staff.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 0.8fr 0.6fr',
                    gap: 12,
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    alignItems: 'center',
                    fontSize: 13,
                    background: s.active ? '#ffffff' : '#f8fafc',
                    opacity: s.active ? 1 : 0.7,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>

                  <div>
                    {editingId === s.id ? (
                      <select
                        value={editingRole}
                        onChange={e => setEditingRole(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          borderRadius: 4,
                          border: '1px solid #d8dee9',
                          fontSize: 12,
                        }}
                      >
                        <option value="staff">Staff</option>
                        <option value="teacher">Teacher</option>
                        <option value="therapist">Therapist</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: '#64748b' }}>{s.role}</span>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: s.active ? '#dcfce7' : '#fee2e2',
                        color: s.active ? '#166534' : '#991b1b',
                      }}
                    >
                      {s.active ? '✓ Active' : '✕ Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {editingId === s.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateRole(s.id, editingRole)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: 'none',
                            background: '#48698d',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #d8dee9',
                            background: '#fff',
                            fontSize: 10,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(s.id)
                            setEditingRole(s.role)
                          }}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #d8dee9',
                            background: '#f8fafc',
                            fontSize: 10,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(s.id, s.active)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #d8dee9',
                            background: s.active ? '#fee2e2' : '#dcfce7',
                            color: s.active ? '#9f1239' : '#166534',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {s.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#172033',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
