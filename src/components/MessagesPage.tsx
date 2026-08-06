import { useMemo, useState } from 'react'

type Message = {
  id: number
  from: string
  to: string[]
  subject?: string
  body: string
  timestamp: string
  read: boolean
  threadId: number
  replyTo?: number
}

type Announcement = {
  id: number
  title: string
  body: string
  audience: string
  urgent: boolean
  sentBy: string
  timestamp: string
  ackRequired: boolean
  ackCount: number
  expiresAt?: string
}

type Group = {
  id: number
  name: string
  members: string[]
  createdBy: string
}

const DEMO_MESSAGES: Message[] = [
  { id: 1, from: 'Rabbi Menachem Cohen', to: ['Principal Klein'], subject: 'Class 7A Concern', body: 'Good morning, wanted to flag a concern about attendance this week in 7A. Three students missed yesterday without notice.', timestamp: '2026-07-31T08:15:00Z', read: true, threadId: 1 },
  { id: 2, from: 'Principal Klein', to: ['Rabbi Menachem Cohen'], subject: 'Re: Class 7A Concern', body: 'Thank you for flagging. I will follow up with the families this afternoon. Please mark them as Unknown Location in the system so we can track.', timestamp: '2026-07-31T09:02:00Z', read: true, threadId: 1, replyTo: 1 },
  { id: 3, from: 'Sarah Cohen', to: ['Principal Klein'], subject: 'Counseling Session Notes', body: 'Hi, just a heads up — I had a session with Yosef Friedman today. He is making progress. I will update his support notes shortly.', timestamp: '2026-07-31T10:30:00Z', read: false, threadId: 2 },
  { id: 4, from: 'Mrs. Goldstein', to: ['Principal Klein'], subject: 'Early Dismissal Request', body: 'Sending a note that Avrumy Goldstein has an orthodontist appointment tomorrow at 2pm and will need early dismissal.', timestamp: '2026-07-30T16:45:00Z', read: true, threadId: 3 },
  { id: 5, from: 'Principal Klein', to: ['Head Staff'], subject: 'Staff Meeting Reminder', body: 'Reminder: monthly staff meeting is tomorrow at 3:30pm in the main conference room. Please come prepared with any updates.', timestamp: '2026-07-30T14:00:00Z', read: true, threadId: 4 },
]

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'End-of-Year Schedule Changes', body: 'Please note that the final week schedule has been updated. Classes will end at 1pm on Tuesday and Wednesday. Full details have been sent to all teachers.', audience: 'All Staff', urgent: false, sentBy: 'Principal Klein', timestamp: '2026-07-30T09:00:00Z', ackRequired: true, ackCount: 12, expiresAt: '2026-08-05T00:00:00Z' },
  { id: 2, title: 'IMPORTANT: Emergency Drill Tomorrow', body: 'We will be conducting a fire safety drill tomorrow at 10:15am. Please review the evacuation procedures with your class beforehand.', audience: 'All Staff', urgent: true, sentBy: 'Principal Klein', timestamp: '2026-07-31T07:30:00Z', ackRequired: true, ackCount: 8 },
  { id: 3, title: 'Therapy Room Scheduling Update', body: 'Room 104 will be unavailable on Thursday due to maintenance. Please schedule sessions in Room 108 as an alternate.', audience: 'Therapists', urgent: false, sentBy: 'Office Admin', timestamp: '2026-07-29T11:00:00Z', ackRequired: false, ackCount: 0 },
]

const DEMO_GROUPS: Group[] = [
  { id: 1, name: 'Head Staff', members: ['Principal Klein', 'Vice Principal', 'Menahel'], createdBy: 'Principal Klein' },
  { id: 2, name: 'Morning Teachers', members: ['Rabbi Cohen', 'Rabbi Baum', 'Rabbi Friedman', 'Rabbi Weiss'], createdBy: 'Principal Klein' },
  { id: 3, name: 'Therapists', members: ['Sarah Cohen', 'Tzvi Horowitz', 'Shelly Rosen'], createdBy: 'Office Admin' },
  { id: 4, name: 'BT Team', members: ['Yanky Weinstein', 'Moshe Katz', 'Leiby Green'], createdBy: 'Principal Klein' },
]

const AUDIENCE_OPTIONS = [
  'All Staff',
  'All Teachers',
  'Therapists',
  'BT Team',
  'Head Staff',
  'Yeshiva Ketana Staff',
  'Office Staff',
]

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHrs = diffMs / 1000 / 3600
    if (diffHrs < 1) return `${Math.round(diffMs / 60000)}m ago`
    if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

export default function MessagesPage({ S, userName, role }) {
  const [view, setView] = useState<'inbox' | 'announcements' | 'groups'>('inbox')
  const [selectedThread, setSelectedThread] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS)
  const [groups] = useState<Group[]>(DEMO_GROUPS)
  const [composing, setComposing] = useState(false)
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' })
  const [composingAnnouncement, setComposingAnnouncement] = useState(false)
  const [announceDraft, setAnnounceDraft] = useState({ title: '', body: '', audience: 'All Staff', urgent: false, ackRequired: false })
  const [ackedIds, setAckedIds] = useState<Set<number>>(new Set())

  const isLeadership = role === 'admin'
  const maxRecipients = isLeadership ? Infinity : 10

  const unreadCount = messages.filter(m => !m.read && m.to.includes(userName || 'Principal Klein')).length

  const threadGroups = useMemo(() => {
    const byThread: Record<number, Message[]> = {}
    messages.forEach(m => {
      if (!byThread[m.threadId]) byThread[m.threadId] = []
      byThread[m.threadId].push(m)
    })
    return Object.entries(byThread).map(([tid, msgs]) => ({
      threadId: Number(tid),
      messages: msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      lastMessage: msgs[msgs.length - 1],
      subject: msgs[0].subject || '(no subject)',
      participants: Array.from(new Set(msgs.flatMap(m => [m.from, ...m.to]))).filter(p => p !== (userName || 'Principal Klein')),
    })).sort((a, b) => b.lastMessage.timestamp.localeCompare(a.lastMessage.timestamp))
  }, [messages, userName])

  const selectedThreadMessages = selectedThread != null
    ? (threadGroups.find(t => t.threadId === selectedThread)?.messages || [])
    : []

  function sendReply() {
    if (!replyText.trim() || selectedThread == null) return
    const newMsg: Message = {
      id: Date.now(),
      from: userName || 'Principal Klein',
      to: selectedThreadMessages[0]?.from ? [selectedThreadMessages[0].from] : [],
      subject: selectedThreadMessages[0]?.subject,
      body: replyText.trim(),
      timestamp: new Date().toISOString(),
      read: true,
      threadId: selectedThread,
      replyTo: selectedThreadMessages[selectedThreadMessages.length - 1]?.id,
    }
    setMessages(prev => [...prev, newMsg])
    setReplyText('')
  }

  function sendNewMessage() {
    if (!composeData.body.trim() || !composeData.to.trim()) return
    const newThreadId = Math.max(...messages.map(m => m.threadId), 0) + 1
    const newMsg: Message = {
      id: Date.now(),
      from: userName || 'Principal Klein',
      to: composeData.to.split(',').map(t => t.trim()).filter(Boolean),
      subject: composeData.subject || undefined,
      body: composeData.body.trim(),
      timestamp: new Date().toISOString(),
      read: true,
      threadId: newThreadId,
    }
    setMessages(prev => [...prev, newMsg])
    setComposeData({ to: '', subject: '', body: '' })
    setComposing(false)
    setSelectedThread(newThreadId)
  }

  function postAnnouncement() {
    if (!announceDraft.title.trim() || !announceDraft.body.trim()) return
    const newAnn: Announcement = {
      id: Date.now(),
      title: announceDraft.title.trim(),
      body: announceDraft.body.trim(),
      audience: announceDraft.audience,
      urgent: announceDraft.urgent,
      sentBy: userName || 'Principal Klein',
      timestamp: new Date().toISOString(),
      ackRequired: announceDraft.ackRequired,
      ackCount: 0,
    }
    setAnnouncements(prev => [newAnn, ...prev])
    setAnnounceDraft({ title: '', body: '', audience: 'All Staff', urgent: false, ackRequired: false })
    setComposingAnnouncement(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#16243a' }}>
          Messages &amp; Announcements
        </h1>
        <div style={{ fontSize: 12, color: '#64748b' }}>Staff communication and school-wide announcements</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
        {[
          { id: 'inbox', label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { id: 'announcements', label: 'Announcements' },
          { id: 'groups', label: 'Groups' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setView(tab.id as any); setSelectedThread(null); setComposing(false); setComposingAnnouncement(false) }}
            style={{
              padding: '9px 16px',
              borderRadius: '8px 8px 0 0',
              border: '1px solid',
              borderBottom: view === tab.id ? '1px solid #fff' : '1px solid #e2e8f0',
              borderColor: view === tab.id ? '#e2e8f0' : 'transparent',
              borderBottomColor: view === tab.id ? '#fff' : 'transparent',
              background: view === tab.id ? '#fff' : 'transparent',
              color: view === tab.id ? '#0f172a' : '#64748b',
              fontWeight: view === tab.id ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INBOX */}
      {view === 'inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedThread != null ? '320px 1fr' : '1fr', gap: 12, alignItems: 'start' }}>
          {/* Thread list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Conversations</div>
              <button onClick={() => { setComposing(true); setSelectedThread(null) }} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                + New Message
              </button>
            </div>

            {composing && (
              <div style={{ ...S.card, marginBottom: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>New Message</div>
                <input
                  value={composeData.to}
                  onChange={e => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder={isLeadership ? 'To (name or group, comma-separated)' : 'To (up to 10 people)'}
                  spellCheck={false}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, marginBottom: 7, boxSizing: 'border-box' }}
                />
                <input
                  value={composeData.subject}
                  onChange={e => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject (optional)"
                  spellCheck
                  lang="en"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, marginBottom: 7, boxSizing: 'border-box' }}
                />
                <textarea
                  value={composeData.body}
                  onChange={e => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Message..."
                  spellCheck
                  lang="en"
                  rows={4}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', marginBottom: 7 }}
                />
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={sendNewMessage} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Send</button>
                  <button onClick={() => setComposing(false)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {threadGroups.map(thread => {
                const isSelected = selectedThread === thread.threadId
                const hasUnread = thread.messages.some(m => !m.read && m.to.includes(userName || 'Principal Klein'))
                return (
                  <div
                    key={thread.threadId}
                    onClick={() => { setSelectedThread(thread.threadId); setComposing(false) }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}`,
                      background: isSelected ? '#eff6ff' : hasUnread ? '#f8fafc' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: hasUnread ? 800 : 600, color: '#0f172a' }}>
                        {thread.participants.slice(0, 2).join(', ') || 'You'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatTimestamp(thread.lastMessage.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: hasUnread ? 700 : 400, color: '#334155', marginBottom: 2 }}>{thread.subject}</div>
                    <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {thread.lastMessage.body}
                    </div>
                    {hasUnread && (
                      <div style={{ display: 'inline-flex', marginTop: 4, background: '#2563eb', color: '#fff', borderRadius: 99, fontSize: 9, padding: '1px 6px', fontWeight: 700 }}>NEW</div>
                    )}
                  </div>
                )
              })}
              {threadGroups.length === 0 && (
                <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: 13 }}>No messages yet.</div>
              )}
            </div>
          </div>

          {/* Thread detail */}
          {selectedThread != null && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {threadGroups.find(t => t.threadId === selectedThread)?.subject}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {threadGroups.find(t => t.threadId === selectedThread)?.participants.join(', ')}
                  </div>
                </div>
                <button onClick={() => setSelectedThread(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, maxHeight: 360, overflowY: 'auto' }}>
                {selectedThreadMessages.map(msg => {
                  const isMine = msg.from === (userName || 'Principal Klein')
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: isMine ? '#0f172a' : '#f1f5f9', color: isMine ? '#fff' : '#0f172a', fontSize: 13 }}>
                        {msg.body}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                        {msg.from} · {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Reply..."
                  spellCheck
                  lang="en"
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
                />
                <button onClick={sendReply} disabled={!replyText.trim()} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {view === 'announcements' && (
        <div>
          {isLeadership && (
            <div style={{ marginBottom: 14 }}>
              {!composingAnnouncement ? (
                <button onClick={() => setComposingAnnouncement(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  + Post Announcement
                </button>
              ) : (
                <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>New Announcement</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      value={announceDraft.title}
                      onChange={e => setAnnounceDraft(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title"
                      spellCheck
                      lang="en"
                      style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13 }}
                    />
                    <textarea
                      value={announceDraft.body}
                      onChange={e => setAnnounceDraft(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Announcement body..."
                      spellCheck
                      lang="en"
                      rows={4}
                      style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={announceDraft.audience}
                        onChange={e => setAnnounceDraft(prev => ({ ...prev, audience: e.target.value }))}
                        style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12 }}
                      >
                        {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={announceDraft.urgent} onChange={e => setAnnounceDraft(prev => ({ ...prev, urgent: e.target.checked }))} />
                        Mark as urgent
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input type="checkbox" checked={announceDraft.ackRequired} onChange={e => setAnnounceDraft(prev => ({ ...prev, ackRequired: e.target.checked }))} />
                        Require acknowledgment
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={postAnnouncement} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Post</button>
                      <button onClick={() => setComposingAnnouncement(false)} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map(ann => {
              const acked = ackedIds.has(ann.id)
              return (
                <div key={ann.id} style={{ ...S.card, borderLeft: `4px solid ${ann.urgent ? '#dc2626' : '#3b82f6'}`, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {ann.urgent && <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>URGENT</span>}
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{ann.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}>{ann.body}</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
                        <span>Sent by: {ann.sentBy}</span>
                        <span>·</span>
                        <span>To: {ann.audience}</span>
                        <span>·</span>
                        <span>{formatTimestamp(ann.timestamp)}</span>
                        {ann.ackRequired && <span>· {ann.ackCount} acknowledged</span>}
                      </div>
                    </div>
                    {ann.ackRequired && !isLeadership && (
                      <button
                        onClick={() => setAckedIds(prev => new Set([...prev, ann.id]))}
                        disabled={acked}
                        style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${acked ? '#bbf7d0' : '#e5e7eb'}`, background: acked ? '#f0fdf4' : '#fff', color: acked ? '#15803d' : '#334155', fontSize: 11, cursor: acked ? 'default' : 'pointer', fontWeight: acked ? 700 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        {acked ? '✓ Acknowledged' : 'Acknowledge'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {announcements.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No announcements yet.</div>
            )}
          </div>
        </div>
      )}

      {/* GROUPS */}
      {view === 'groups' && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#334155' }}>
            Messaging Groups
            {!isLeadership && <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>Groups are managed by Leadership</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {groups.map(group => (
              <div key={group.id} style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{group.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                  Created by {group.createdBy} · {group.members.length} members
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {group.members.map(m => (
                    <span key={m} style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', borderRadius: 99, padding: '2px 8px' }}>{m}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 7 }}>
                  <button
                    onClick={() => { setView('inbox'); setComposing(true); setComposeData(prev => ({ ...prev, to: group.name })) }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, cursor: 'pointer' }}
                  >
                    Message Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
