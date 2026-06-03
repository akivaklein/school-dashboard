import { useState } from 'react'
const students = [
{ id: 1, name: 'Alex B.', points: 45, redMarks: 2, att: ['P','P','L','L','L'], breakfast: ['Y','Y','N','N','N'], detention: true, services: [{type:'Speech Therapy', hrs: 1.5}] },
{ id: 2, name: 'Brianna C.', points: 80, redMarks: 0, att: ['A','A','P','P','P'], breakfast: ['Y','Y','Y','Y','Y'], detention: false, services: [] },
{ id: 3, name: 'Carlos D.', points: 60, redMarks: 3, att: ['P','L','A','P','P'], breakfast: ['N','N','N','Y','Y'], detention: false, services: [{type:'Therapy', hrs: 3}] },
{ id: 4, name: 'Dana E.', points: 95, redMarks: 0, att: ['P','P','P','P','P'], breakfast: ['Y','Y','Y','Y','Y'], detention: false, services: [] },
{ id: 5, name: 'Ethan F.', points: 20, redMarks: 5, att: ['A','A','A','P','P'], breakfast: ['N','N','N','N','Y'], detention: false, services: [] },
{ id: 6, name: 'Fatima G.', points: 70, redMarks: 1, att: ['P','P','P','L','P'], breakfast: ['Y','N','N','N','Y'], detention: false, services: [{type:'Reading Support', hrs: 2}] },
{ id: 7, name: 'Grace H.', points: 55, redMarks: 6, att: ['P','P','P','P','A'], breakfast: ['Y','Y','Y','Y','Y'], detention: true, services: [] },
{ id: 8, name: 'Henry I.', points: 40, redMarks: 2, att: ['L','L','L','L','P'], breakfast: ['Y','Y','Y','N','N'], detention: false, services: [{type:'Counseling', hrs: 0.5}] },
]
const storeItems = [
{ id: 1, name: 'Extra Recess', cost: 50 },
{ id: 2, name: 'Sit with Friend', cost: 30 },
{ id: 3, name: 'No Homework Pass', cost: 100 },
{ id: 4, name: 'Choose Class Game', cost: 75 },
{ id: 5, name: 'Homework Helper', cost: 40 },
]
const DAYS = ['Mon','Tue','Wed','Thu','Fri']
export default function Dashboard() {
const [studentList, setStudentList] = useState(students)
const [activeTab, setActiveTab] = useState('alerts')
const [selectedStudent, setSelectedStudent] = useState(null)
function addPoints(id, amount) {
setStudentList(prev => prev.map(s => s.id === id ? {...s, points: Math.max(0, s.points + amount)} : s))
}
function addRedMark(id) {
setStudentList(prev => prev.map(s => s.id === id ? {...s, redMarks: s.redMarks + 1} : s))
}
function buyItem(studentId, cost, itemName) {
const student = studentList.find(s => s.id === studentId)
if (!student || student.points < cost) { alert('Not enough points!'); return }
setStudentList(prev => prev.map(s => s.id === studentId ? {...s, points: s.points - cost} : s))
alert(student.name + ' redeemed: ' + itemName + '!')
}
const alerts = studentList.flatMap(s => {
const a = []
const absCount = s.att.filter(d => d === 'A').length
const lateCount = s.att.filter(d => d === 'L').length
const skipBreakfast = s.breakfast.filter(d => d === 'N').length
if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
if (s.redMarks >= 6) a.push({ student: s.name, id: s.id, msg: '6 red marks - consequence required!', type: 'danger' })
if (s.redMarks >= 4 && s.redMarks < 6) a.push({ student: s.name, id: s.id, msg: s.redMarks + ' red marks this week', type: 'warn' })
if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: 'Absent ' + absCount + ' days this week', type: absCount >= 3 ? 'danger' : 'warn' })
if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: 'Late ' + lateCount + ' days in a row', type: 'warn' })
if (skipBreakfast >= 3) a.push({ student: s.name, id: s.id, msg: 'Skipped breakfast ' + skipBreakfast + ' days', type: 'warn' })
if (s.services.length > 0) a.push({ student: s.name, id: s.id, msg: 'Pulled for: ' + s.services.map(x => x.type).join(', '), type: 'info' })
return a
})
const present = studentList.filter(s => s.att[4] === 'P').length
const absent = studentList.filter(s => s.att[4] === 'A').length
const late = studentList.filter(s => s.att[4] === 'L').length
return (
<div style={{fontFamily:'sans-serif', padding:'1rem', maxWidth:'900px', margin:'0 auto'}}>
<div style={{marginBottom:'1rem'}}>
<h1 style={{fontSize:'22px', fontWeight:'600', margin:0}}>Class Dashboard</h1>
<p style={{color:'#666', margin:'4px 0 0', fontSize:'14px'}}>Room 204 - Ms. Rivera - Week of Jun 2</p>
</div>
<div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'1.5rem'}}>
<div style={{background:'#f3f4f6', borderRadius:'10px', padding:'14px'}}>
<div style={{fontSize:'12px', color:'#666', marginBottom:'6px'}}>Present Today</div>
<div style={{fontSize:'24px', fontWeight:'600', color:'#16a34a'}}>{present}</div>
</div>
<div style={{background:'#f3f4f6', borderRadius:'10px', padding:'14px'}}>
<div style={{fontSize:'12px', color:'#666', marginBottom:'6px'}}>Absent Today</div>
<div style={{fontSize:'24px', fontWeight:'600', color:'#dc2626'}}>{absent}</div>
</div>
<div style={{background:'#f3f4f6', borderRadius:'10px', padding:'14px'}}>
<div style={{fontSize:'12px', color:'#666', marginBottom:'6px'}}>Late Today</div>
<div style={{fontSize:'24px', fontWeight:'600', color:'#d97706'}}>{late}</div>
</div>
<div style={{background:'#f3f4f6', borderRadius:'10px', padding:'14px'}}>
<div style={{fontSize:'12px', color:'#666', marginBottom:'6px'}}>Active Alerts</div>
<div style={{fontSize:'24px', fontWeight:'600', color:'#dc2626'}}>{alerts.length}</div>
</div>
</div>
<div style={{display:'flex', gap:'4px', borderBottom:'1px solid #e5e7eb', marginBottom:'1rem'}}>
<button onClick={() => setActiveTab('alerts')} style={{padding:'8px 16px', border:'none', background:'none', cursor:'pointer', borderBottom: activeTab === 'alerts' ? '2px solid #111' : '2px solid transparent', fontWeight: activeTab === 'alerts' ? '600' : '400', fontSize:'14px'}}>Alerts</button>
<button onClick={() => setActiveTab('roster')} style={{padding:'8px 16px', border:'none', background:'none', cursor:'pointer', borderBottom: activeTab === 'roster' ? '2px solid #111' : '2px solid transparent', fontWeight: activeTab === 'roster' ? '600' : '400', fontSize:'14px'}}>Attendance</button>
<button onClick={() => setActiveTab('points')} style={{padding:'8px 16px', border:'none', background:'none', cursor:'pointer', borderBottom: activeTab === 'points' ? '2px solid #111' : '2px solid transparent', fontWeight: activeTab === 'points' ? '600' : '400', fontSize:'14px'}}>Points</button>
<button onClick={() => setActiveTab('store')} style={{padding:'8px 16px', border:'none', background:'none', cursor:'pointer', borderBottom: activeTab === 'store' ? '2px solid #111' : '2px solid transparent', fontWeight: activeTab === 'store' ? '600' : '400', fontSize:'14px'}}>Store</button>
</div>
{activeTab === 'alerts' && (
<div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
{alerts.length === 0 && <p style={{color:'#999', textAlign:'center', padding:'2rem'}}>No alerts today!</p>}
{alerts.map((a, i) => (
<div key={i} style={{background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: '1px solid ' + (a.type === 'danger' ? '#fca5a5' : a.type === 'warn' ? '#fcd34d' : '#bfdbfe'), borderRadius:'10px', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
<div>
<div style={{fontWeight:'600', fontSize:'14px'}}>{a.student}</div>
<div style={{fontSize:'13px', color:'#555', marginTop:'2px'}}>{a.msg}</div>
</div>
<div style={{display:'flex', gap:'6px'}}>
<button onClick={() => addPoints(a.id, -5)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'6px', border:'1px solid #ddd', background:'#fff', cursor:'pointer'}}>-5 pts</button>
<button onClick={() => addRedMark(a.id)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'6px', border:'1px solid #fca5a5', background:'#fef2f2', cursor:'pointer'}}>Red Mark</button>
</div>
</div>
))}
</div>
)}
{activeTab === 'roster' && (
<div style={{overflowX:'auto'}}>
<table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
<thead>
<tr style={{borderBottom:'2px solid #e5e7eb'}}>
<th style={{textAlign:'left', padding:'8px'}}>Student</th>
<th style={{padding:'8px'}}>Mon</th>
<th style={{padding:'8px'}}>Tue</th>
<th style={{padding:'8px'}}>Wed</th>
<th style={{padding:'8px'}}>Thu</th>
<th style={{padding:'8px'}}>Fri</th>
<th style={{padding:'8px'}}>P</th>
<th style={{padding:'8px'}}>A</th>
<th style={{padding:'8px'}}>L</th>
</tr>
</thead>
<tbody>
{studentList.map(s => (
<tr key={s.id} style={{borderBottom:'1px solid #f3f4f6'}}>
<td style={{padding:'8px', fontWeight:'500'}}>{s.name}</td>
{s.att.map((d,i) => (
<td key={i} style={{padding:'8px', textAlign:'center'}}>
<span style={{background: d==='P'?'#dcfce7':d==='A'?'#fee2e2':'#dbeafe', color: d==='P'?'#16a34a':d==='A'?'#dc2626':'#2563eb', padding:'2px 8px', borderRadius:'20px', fontSize:'12px', fontWeight:'500'}}>{d}</span>
</td>
))}
<td style={{textAlign:'center', padding:'8px'}}>{s.att.filter(d=>d==='P').length}</td>
<td style={{textAlign:'center', padding:'8px', color:'#dc2626'}}>{s.att.filter(d=>d==='A').length}</td>
<td style={{textAlign:'center', padding:'8px', color:'#d97706'}}>{s.att.filter(d=>d==='L').length}</td>
</tr>
))}
</tbody>
</table>
</div>
)}
{activeTab === 'points' && (
<div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
{studentList.sort((a,b) => b.points - a.points).map(s => (
<div key={s.id} style={{background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
<div>
<div style={{fontWeight:'600', fontSize:'14px'}}>{s.name}</div>
<div style={{fontSize:'12px', color:'#666', marginTop:'2px'}}>Red marks: {s.redMarks} {s.redMarks >= 6 ? '- CONSEQUENCE REQUIRED' : ''}</div>
</div>
<div style={{display:'flex', alignItems:'center', gap:'8px'}}>
<button onClick={() => addPoints(s.id, -10)} style={{padding:'4px 10px', borderRadius:'6px', border:'1px solid #ddd', background:'#fff', cursor:'pointer', fontSize:'13px'}}>-10</button>
<span style={{fontSize:'20px', fontWeight:'700', color:'#d97706', minWidth:'60px', textAlign:'center'}}>{s.points} pts</span>
<button onClick={() => addPoints(s.id, 10)} style={{padding:'4px 10px', borderRadius:'6px', border:'1px solid #ddd', background:'#fff', cursor:'pointer', fontSize:'13px'}}>+10</button>
<button onClick={() => addRedMark(s.id)} style={{padding:'4px 10px', borderRadius:'6px', border:'1px solid #fca5a5', background:'#fef2f2', cursor:'pointer', fontSize:'13px'}}>Red Mark</button>
</div>
</div>
))}
</div>
)}
{activeTab === 'store' && (
<div>
<p style={{fontSize:'13px', color:'#666', marginBottom:'1rem'}}>Select a student then redeem a reward:</p>
<div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'1rem'}}>
{studentList.map(s => (
<button key={s.id} onClick={() => setSelectedStudent(s.id)} style={{padding:'6px 12px', borderRadius:'20px', border:'1px solid #ddd', cursor:'pointer', fontSize:'13px', background: selectedStudent === s.id ? '#111' : '#fff', color: selectedStudent === s.id ? '#fff' : '#111'}}>{s.name} - {s.points} pts</button>
))}
</div>
{selectedStudent && (
<div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'10px'}}>
{storeItems.map(item => {
const student = studentList.find(s => s.id === selectedStudent)
const canAfford = student && student.points >= item.cost
return (
<div key={item.id} style={{background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'16px', textAlign:'center'}}>
<div style={{fontWeight:'600', fontSize:'14px', marginBottom:'6px'}}>{item.name}</div>
<div style={{color:'#d97706', fontWeight:'700', fontSize:'16px', marginBottom:'10px'}}>{item.cost} pts</div>
<button onClick={() => buyItem(selectedStudent, item.cost, item.name)} style={{padding:'6px 16px', borderRadius:'6px', border:'none', cursor: canAfford ? 'pointer' : 'not-allowed', background: canAfford ? '#16a34a' : '#d1d5db', color:'#fff', fontSize:'13px', fontWeight:'500'}}>{canAfford ? 'Redeem' : 'Not enough'}</button>
</div>
)
})}
</div>
)}
</div>
)}
</div>
)
}