import React, { useState, useEffect, useRef } from 'react'
import { loadStaffMembers, addStaffMember } from '../services/staffService'

interface StaffMember {
  id: number
  name: string
  role: string
  active: boolean
}

interface StaffLoginPanelProps {
  loggedInStaff: StaffMember[]
  onAddLogin: (staff: StaffMember) => void
  onRemoveLogin: (staffId: number) => void
  onShowManagement?: () => void
  onClose?: () => void
}

export default function StaffLoginPanel({ loggedInStaff, onAddLogin, onRemoveLogin, onShowManagement, onClose }: StaffLoginPanelProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('staff')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingStaff, setAddingStaff] = useState(false)
  const [dragPosition, setDragPosition] = useState(() => ({
    top: 20,
    left: typeof window !== 'undefined' ? Math.max(window.innerWidth - 360, 16) : 20,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadStaffList()
  }, [])

  async function loadStaffList() {
    const members = await loadStaffMembers()
    setStaff(members.filter(s => s.active))
  }

  const filteredStaff = searchInput.length > 0
    ? staff.filter(
        s =>
          s.name.toLowerCase().includes(searchInput.toLowerCase()) &&
          !loggedInStaff.some(logged => logged.id === s.id)
      )
    : []

  async function handleAddStaff() {
    if (!newStaffName.trim()) return

    setAddingStaff(true)
    const created = await addStaffMember(newStaffName, newStaffRole)
    if (created) {
      await loadStaffList()
      onAddLogin(created)
      setNewStaffName('')
      setNewStaffRole('staff')
      setShowAddForm(false)
    }
    setAddingStaff(false)
  }

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (event: MouseEvent) => {
      const panelWidth = panelRef.current?.offsetWidth ?? 340
      const panelHeight = panelRef.current?.offsetHeight ?? 520
      const maxLeft = Math.max(window.innerWidth - panelWidth - 8, 8)
      const maxTop = Math.max(window.innerHeight - panelHeight - 8, 8)

      const nextLeft = Math.min(
        maxLeft,
        Math.max(8, event.clientX - dragOffsetRef.current.x)
      )
      const nextTop = Math.min(
        maxTop,
        Math.max(8, event.clientY - dragOffsetRef.current.y)
      )

      setDragPosition({ left: nextLeft, top: nextTop })
    }

    const onMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  function startDragging(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('button')) return

    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    setIsDragging(true)
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: dragPosition.top,
        left: dragPosition.left,
        zIndex: 999,
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 12px 36px rgba(15,23,42,0.18)',
        border: '1px solid #e2e8f0',
        maxWidth: 340,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={startDragging}
        style={{
          background: '#0f172a',
          color: '#fff',
          padding: '14px 16px',
          fontWeight: 700,
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          gap: 8,
        }}
        title="Drag to move"
      >
        <span>👥 Logged In Staff</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onShowManagement}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: 24,
              height: 24,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
            title="Manage staff accounts"
          >
            ⚙️
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 24,
                height: 24,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
              }}
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Currently logged in users */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        {loggedInStaff.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0', textAlign: 'center' }}>No one logged in</div>
        ) : (
          loggedInStaff.map(s => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: '#f0fdf4',
                borderRadius: 8,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ color: '#56765f', flex: 1 }}>
                ✓ {s.name} <span style={{ fontSize: 10, opacity: 0.7 }}>({s.role})</span>
              </span>
              <button
                onClick={() => onRemoveLogin(s.id)}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  color: '#9f1239',
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                }}
                title="Log out"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Login search box */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
        <input
          type="text"
          placeholder="Add login..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #d8dee9',
            fontSize: 12,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        {/* Dropdown suggestions */}
        {showDropdown && filteredStaff.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 16,
              right: 16,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #d8dee9',
              borderRadius: 8,
              boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
              zIndex: 1000,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {filteredStaff.map(s => (
              <div
                key={s.id}
                onClick={() => {
                  onAddLogin(s)
                  setSearchInput('')
                  setShowDropdown(false)
                }}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  fontSize: 12,
                  background: '#ffffff',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
              >
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.role}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new staff link */}
      <div style={{ padding: '8px 16px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 8,
            border: '1px solid #d8dee9',
            background: '#f8fafc',
            color: '#334155',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#eef3f8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
        >
          + Add New Staff
        </button>
      </div>

      {/* Add new staff form */}
      {showAddForm && (
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <input
            type="text"
            placeholder="Full name"
            value={newStaffName}
            onChange={e => setNewStaffName(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid #d8dee9',
              fontSize: 11,
              boxSizing: 'border-box',
              marginBottom: 6,
              outline: 'none',
            }}
          />
          <select
            value={newStaffRole}
            onChange={e => setNewStaffRole(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid #d8dee9',
              fontSize: 11,
              boxSizing: 'border-box',
              marginBottom: 6,
              outline: 'none',
            }}
          >
            <option value="staff">Staff</option>
            <option value="teacher">Teacher</option>
            <option value="therapist">Therapist</option>
            <option value="admin">Admin</option>
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={handleAddStaff}
              disabled={addingStaff || !newStaffName.trim()}
              style={{
                padding: '6px',
                borderRadius: 6,
                border: 'none',
                background: '#48698d',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: addingStaff || !newStaffName.trim() ? 0.5 : 1,
              }}
            >
              {addingStaff ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewStaffName('')
              }}
              style={{
                padding: '6px',
                borderRadius: 6,
                border: '1px solid #d8dee9',
                background: '#fff',
                color: '#334155',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
