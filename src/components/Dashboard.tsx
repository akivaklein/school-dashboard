import { useState, useEffect } from 'react'

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    if (type === 'positive') { o.frequency.setValueAtTime(520, ctx.currentTime); o.frequency.setValueAtTime(800, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); o.start(); o.stop(ctx.currentTime + 0.4) }
    else if (type === 'negative') { o.frequency.setValueAtTime(300, ctx.currentTime); o.frequency.setValueAtTime(200, ctx.currentTime + 0.15); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o.start(); o.stop(ctx.currentTime + 0.3) }
    else if (type === 'redmark') { o.frequency.setValueAtTime(200, ctx.currentTime); o.frequency.setValueAtTime(150, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.4, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.start(); o.stop(ctx.currentTime + 0.5) }
    else if (type === 'store') { o.frequency.setValueAtTime(600, ctx.currentTime); o.frequency.setValueAtTime(1000, ctx.currentTime + 0.2); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); o.start(); o.stop(ctx.currentTime + 0.5) }
  } catch(e) {}
}

const BEHAVIORS_POSITIVE = [
  { id: 'p1', label: 'Appropriate appearance', points: 1 },
  { id: 'p2', label: 'On-time to class', points: 2 },
  { id: 'p3', label: 'Ignored peer misbehavior', points: 2 },
  { id: 'p4', label: 'Major appropriate behavior', points: 3 },
  { id: 'p5', label: 'Completed homework', points: 2 },
  { id: 'p6', label: 'Helped a classmate', points: 2 },
]
const BEHAVIORS_NEGATIVE = [
  { id: 'n1', label: 'Speaking without permission', points: -1 },
  { id: 'n2', label: 'Off-task behavior', points: -1 },
  { id: 'n3', label: 'Noncompliance', points: -1 },
  { id: 'n4', label: 'Disruptive behavior', points: -1 },
  { id: 'n5', label: 'Disrespect', points: -2 },
  { id: 'n6', label: 'Physical aggression', points: -3 },
]

const STORE_ITEMS = [
  { id: 1, name: "Reisman's Brownie Bar", cost: 20, emoji: '🍫', vip: false },
  { id: 2, name: 'Ice Cream Cone', cost: 25, emoji: '🍦', vip: false },
  { id: 3, name: 'Ice Cream Stick', cost: 20, emoji: '🍧', vip: false },
  { id: 4, name: 'Slush', cost: 15, emoji: '🧊', vip: false },
  { id: 5, name: 'Pizza Slice', cost: 50, emoji: '🍕', vip: true },
  { id: 6, name: 'Fresh Cookie', cost: 30, emoji: '🍪', vip: true },
]

const STAFF = [
  { id: 's1', name: 'Rabbi Baum', role: 'Menahel' },
  { id: 's2', name: 'Rabbi Ehrnreich', role: 'Sgan Menahel' },
  { id: 's3', name: 'Rabbi Hillel', role: 'Mashgiach' },
  { id: 's4', name: 'Rabbi Klein', role: 'Teacher' },
  { id: 's5', name: 'Rabbi Goldstein', role: 'Teacher' },
  { id: 's6', name: 'Mrs. Goldberg', role: 'Speech Therapist' },
  { id: 's7', name: 'Mr. Weinstein', role: 'OT' },
  { id: 's8', name: 'Mrs. Friedman', role: 'Counselor' },
  { id: 's9', name: 'Yitzi Liebowitz', role: 'Therapist' },
  { id: 's10', name: 'Ezriel', role: 'BT' },
  { id: 's11', name: 'Dovid', role: 'BT' },
  { id: 's12', name: 'Rabbi Lefkowitz', role: 'Teacher' },
  { id: 's13', name: 'Rabbi Ambush', role: 'Teacher' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const TEACHER_CLASS_MAP = {
  'Rabbi Klein': 'a',
  'Rabbi Goldstein': 'b',
  'Rabbi Ehrnreich': 'c',
  'Rabbi Ambush': 'd',
  'Rabbi Lefkowitz': 'a',
}

const CLASSES = [
  { id: 'a', name: 'Dargei Alef', grade: '9th Grade', teacher: 'Rabbi Klein' },
  { id: 'b', name: 'Dargei Beis', grade: '10th Grade', teacher: 'Rabbi Goldstein' },
  { id: 'c', name: 'Dargei Gimmel', grade: '11th Grade', teacher: 'Rabbi Ehrnreich' },
  { id: 'd', name: 'Dargei Daled', grade: '12th Grade', teacher: 'Rabbi Ambush' },
]

const STUDENT_CLASSES = {
  1: 'a', 2: 'a', 3: 'a', 4: 'a', 5: 'a', 6: 'a', 7: 'a',
  8: 'b', 9: 'b', 10: 'b', 11: 'b', 12: 'b', 13: 'b', 14: 'b',
  15: 'c', 16: 'c', 17: 'c', 18: 'c', 19: 'c', 20: 'c', 21: 'c',
  22: 'd', 23: 'd', 24: 'd', 25: 'd', 26: 'd', 27: 'd', 28: 'd',
}

const SCHEDULE_PERIODS = [
  { id: 1, time: '10:10 - 11:10', subject: 'Period 1', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 2, time: '11:20 - 12:05', subject: 'Period 2', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 3, time: '12:15 - 12:45', subject: 'Period 3', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 4, time: '12:45 - 1:45', subject: 'Lunch & Recess', teachers: [], type: 'break' },
  { id: 5, time: '1:45 - 2:25', subject: 'English', teachers: ['Mr. Cohen'], type: 'class' },
  { id: 6, time: '2:30 - 3:10', subject: 'Period 5', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
  { id: 7, time: '3:15 - 3:45', subject: 'Period 6', teachers: ['Rabbi Klein', 'Rabbi Goldstein', 'Rabbi Ehrnreich'], type: 'class' },
]

const THERAPY_SCHEDULE = [
  { student: 'Bloom Yair', staffId: 's6', day: 'Mon', time: '10:10', duration: '45 min', type: 'Speech' },
  { student: 'Haddad Moshe Chaim', staffId: 's8', day: 'Tue', time: '11:20', duration: '60 min', type: 'Counseling' },
  { student: 'Levitz Avrohom', staffId: 's7', day: 'Wed', time: '10:10', duration: '45 min', type: 'OT' },
  { student: 'Feltman Daniel', staffId: 's9', day: 'Thu', time: '10:10', duration: '45 min', type: 'Therapy' },
  { student: 'Schwartz Moishe Michael', staffId: 's8', day: 'Fri', time: '11:20', duration: '30 min', type: 'Counseling' },
]

const mkStudent = (id, name, points, reminders, att, status, withStaff = null, services = [], parentCalls = [], notes = [], iep = false, iepDetails = '', detention = false) => ({
  id, name, points, reminders, lastWeekReminders: reminders + Math.floor(Math.random() * 3),
  att, breakfast: att.map(() => Math.random() > 0.3 ? 'Y' : 'N'),
  detention, status, withStaff, services, parentCalls, notes, behaviorLog: [], iep, iepDetails,
  classLog: [],
  lateDetails: null, // { timeArrived, reason, note }
  family: {
    fatherName: '', fatherPhone: '', fatherEmail: '',
    motherName: '', motherPhone: '', motherEmail: '',
    address: '', emergencyContact: '', emergencyPhone: ''
  },
  medical: {
    allergies: [], medications: [], conditions: [],
    doctorName: '', doctorPhone: '', lastPhysical: '', notes: ''
  }
})

// Sample class log for Levitz Avrohom
// ── HISTORICAL TRACKING DATA (sample data for demo) ──────────────────────────
function makeDay(daysAgo, inMins, outMins, staffName, staffId) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  // Skip Saturdays (6)
  if (d.getDay() === 6) d.setDate(d.getDate() - 1)
  return { date: d.toISOString().slice(0,10), inMins, outMins, staffName, staffId, pct: Math.round(inMins/(inMins+outMins)*100) }
}

const HISTORICAL_DATA = {
  6: [ // Levitz Avrohom
    makeDay(0, 45, 70, 'Yitzi + Ezriel', 's9'),
    makeDay(1, 110, 5, 'Ezriel', 's10'),
    makeDay(2, 85, 30, 'Yitzi Liebowitz', 's9'),
    makeDay(3, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(4, 70, 45, 'Ezriel', 's10'),
    makeDay(7, 100, 15, 'Yitzi Liebowitz', 's9'),
    makeDay(8, 80, 35, 'Dovid', 's11'),
    makeDay(9, 90, 25, 'Ezriel', 's10'),
    makeDay(14, 65, 50, 'Yitzi Liebowitz', 's9'),
    makeDay(15, 105, 10, 'Mrs. Goldberg', 's6'),
    makeDay(20, 75, 40, 'Ezriel', 's10'),
    makeDay(25, 55, 60, 'Yitzi Liebowitz', 's9'),
    makeDay(35, 80, 35, 'Ezriel', 's10'),
    makeDay(45, 90, 25, 'Yitzi Liebowitz', 's9'),
    makeDay(60, 70, 45, 'Mrs. Goldberg', 's6'),
    makeDay(90, 85, 30, 'Ezriel', 's10'),
    makeDay(120, 95, 20, 'Yitzi Liebowitz', 's9'),
  ],
  1: [ // Bloom Yair
    makeDay(0, 60, 45, 'Mrs. Goldberg', 's6'),
    makeDay(1, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(2, 100, 15, 'Mrs. Goldberg', 's6'),
    makeDay(3, 80, 35, 'Mrs. Goldberg', 's6'),
    makeDay(7, 90, 25, 'Mrs. Goldberg', 's6'),
    makeDay(8, 70, 45, 'Mrs. Goldberg', 's6'),
    makeDay(14, 85, 30, 'Mrs. Goldberg', 's6'),
    makeDay(21, 75, 40, 'Mrs. Goldberg', 's6'),
    makeDay(30, 95, 20, 'Mrs. Goldberg', 's6'),
    makeDay(60, 80, 35, 'Mrs. Goldberg', 's6'),
    makeDay(90, 90, 25, 'Mrs. Goldberg', 's6'),
  ],
  3: [ // Haddad Moshe Chaim
    makeDay(0, 30, 85, 'Mrs. Friedman', 's8'),
    makeDay(1, 55, 60, 'Mrs. Friedman', 's8'),
    makeDay(2, 80, 35, 'Mrs. Friedman', 's8'),
    makeDay(3, 40, 75, 'Mrs. Friedman', 's8'),
    makeDay(7, 65, 50, 'Mrs. Friedman', 's8'),
    makeDay(14, 45, 70, 'Mrs. Friedman', 's8'),
    makeDay(21, 70, 45, 'Mrs. Friedman', 's8'),
    makeDay(30, 55, 60, 'Mrs. Friedman', 's8'),
    makeDay(60, 60, 55, 'Mrs. Friedman', 's8'),
  ],
  12: [ // Ettlinger Moshe
    makeDay(0, 50, 65, 'Ezriel + Dovid', 's10'),
    makeDay(1, 85, 30, 'Dovid', 's11'),
    makeDay(2, 70, 45, 'Ezriel', 's10'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 60, 55, 'Ezriel', 's10'),
    makeDay(14, 75, 40, 'Dovid', 's11'),
    makeDay(21, 80, 35, 'Ezriel', 's10'),
    makeDay(30, 65, 50, 'Dovid', 's11'),
  ],
  14: [ // Feltman Daniel
    makeDay(0, 35, 80, 'Yitzi Liebowitz', 's9'),
    makeDay(1, 50, 65, 'Yitzi Liebowitz', 's9'),
    makeDay(2, 75, 40, 'Yitzi Liebowitz', 's9'),
    makeDay(3, 60, 55, 'Yitzi Liebowitz', 's9'),
    makeDay(7, 80, 35, 'Yitzi Liebowitz', 's9'),
    makeDay(14, 45, 70, 'Yitzi Liebowitz', 's9'),
    makeDay(21, 70, 45, 'Yitzi Liebowitz', 's9'),
    makeDay(30, 55, 60, 'Yitzi Liebowitz', 's9'),
    makeDay(60, 65, 50, 'Yitzi Liebowitz', 's9'),
    makeDay(90, 80, 35, 'Yitzi Liebowitz', 's9'),
  ],
  18: [ // Reich Nathan
    makeDay(0, 55, 60, 'Dovid', 's11'),
    makeDay(1, 80, 35, 'Dovid', 's11'),
    makeDay(2, 65, 50, 'Dovid', 's11'),
    makeDay(3, 90, 25, 'Dovid', 's11'),
    makeDay(7, 70, 45, 'Dovid', 's11'),
    makeDay(14, 85, 30, 'Dovid', 's11'),
    makeDay(21, 60, 55, 'Dovid', 's11'),
    makeDay(30, 75, 40, 'Dovid', 's11'),
  ],
}

const LEVITZ_CLASS_LOG = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:35', type: 'out', note: 'Pulled out by Yitzi Liebowitz', staffId: 's9' },
  { time: '11:15', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:20', type: 'out', note: 'Left with Ezriel (BT)', staffId: 's10' },
  { time: '11:55', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]

const initialStudents = [
  mkStudent(1, 'Bloom Yair', 45, 2, ['P','P','L','LE','L','P'], 'present', null, [{staffId:'s6',type:'Speech Therapy',hrs:1.5}], [{date:'2025-05-28',staff:'Rabbi Klein',notes:'Discussed attendance',duration:'8 min'}], [{date:'2025-05-30',author:'Rabbi Klein',text:'Improving in davening.'}], true, 'Speech IEP - review Aug 2025', true),
  mkStudent(2, 'Friedlander Zev', 80, 0, ['P','P','P','P','P','P'], 'late'),
  mkStudent(3, 'Haddad Moshe Chaim', 60, 3, ['P','L','A','P','P','P'], 'therapy', 's8', [{staffId:'s8',type:'Counseling',hrs:3}], [{date:'2025-06-01',staff:'Rabbi Klein',notes:'Left voicemail',duration:'2 min'}]),
  mkStudent(4, 'Hayon David', 95, 0, ['P','P','P','P','P','P'], 'with-bt', 's10', [], [], [{date:'2025-06-02',author:'Rabbi Klein',text:'Excellent week.'}]),
  mkStudent(5, 'Karman Yitzchok', 20, 5, ['A','A','A','P','P','P'], 'absent'),
  mkStudent(6, 'Levitz Avrohom', 70, 1, ['P','P','P','L','P','P'], 'with-bt', 's10', [{staffId:'s7',type:'OT',hrs:2}], [{date:'2025-05-20',staff:'Rabbi Klein',notes:'General check-in',duration:'5 min'}], [], true, 'OT IEP - sensory processing'),
  mkStudent(7, 'Rosenfeld Yehuda', 55, 6, ['P','P','P','P','A','P'], 'late', null, [], [], [], false, '', true),
  mkStudent(8, 'Schwartz Moishe Michael', 40, 2, ['L','LE','L','L','P','P'], 'present', null, [{staffId:'s8',type:'Counseling',hrs:0.5}]),
  mkStudent(9, 'Simon Eliyahu', 65, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(10, 'Berkowitz Avraham', 55, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(11, 'Dinowitz Shmuel', 70, 0, ['P','P','P','P','P','A'], 'absent'),
  mkStudent(12, 'Ettlinger Moshe', 30, 4, ['LE','P','P','A','P','P'], 'present'),
  mkStudent(13, 'Feldman Shraga', 85, 0, ['P','P','P','P','P','P'], 'therapy', 's6'),
  mkStudent(14, 'Feltman Daniel', 45, 2, ['P','A','P','P','L','P'], 'therapy', 's9', [{staffId:'s9',type:'Therapy',hrs:2}]),
  mkStudent(15, 'Gantz Tzvi', 60, 0, ['P','P','P','P','P','P'], 'unknown'),
  mkStudent(16, 'Hickson Shlomo', 25, 5, ['A','A','P','P','P','P'], 'absent'),
  mkStudent(17, 'Mezei Yehuda', 90, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(18, 'Reich Nathan', 50, 3, ['P','L','P','P','A','P'], 'with-bt', 's11'),
  mkStudent(19, 'Teitelbaum Binyamin', 75, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(20, 'Yanni Shimon', 40, 2, ['P','P','A','P','P','P'], 'late'),
  mkStudent(21, 'Moskowitz Meir Shulem', 65, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(22, 'Goldberg Chaim', 50, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(23, 'Lieberman Yehoshua', 60, 1, ['P','P','P','P','L','P'], 'present'),
  mkStudent(24, 'Veksler Aron', 45, 2, ['P','A','P','P','P','P'], 'present'),
  mkStudent(25, 'Shein Dovi', 70, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(26, 'Jakobi Aharon', 35, 3, ['L','P','P','A','P','P'], 'present'),
  mkStudent(27, 'Stern Aaron', 80, 0, ['P','P','P','P','P','P'], 'present'),
  mkStudent(28, 'Sigman Shmuel', 55, 1, ['P','P','L','P','P','P'], 'present'),
]
initialStudents.find(s => s.id === 6).classLog = LEVITZ_CLASS_LOG

// Realistic daily check-in statuses
initialStudents.find(s => s.id === 5).dailyStatus = 'absent'   // Karman Yitzchok
initialStudents.find(s => s.id === 7).dailyStatus = 'late'     // Rosenfeld Yehuda
initialStudents.find(s => s.id === 7).lateDetails = { timeArrived: '10:45', reason: 'parent-called', note: 'Father called, said coming after doctor' }
initialStudents.find(s => s.id === 11).dailyStatus = 'absent'  // Dinowitz Shmuel
initialStudents.find(s => s.id === 16).dailyStatus = 'absent'  // Hickson Shlomo
initialStudents.find(s => s.id === 20).dailyStatus = 'late'    // Yanni Shimon
initialStudents.find(s => s.id === 20).lateDetails = { timeArrived: '11:10', reason: 'transport', note: '' }
initialStudents.find(s => s.id === 8).dailyStatus = 'left-early' // Schwartz Moishe Michael

// Sample family & medical data
initialStudents.find(s => s.id === 6).family = {
  fatherName: 'Moshe Levitz', fatherPhone: '718-555-0101', fatherEmail: 'mlevitz@email.com',
  motherName: 'Rivka Levitz', motherPhone: '718-555-0102', motherEmail: 'rlevitz@email.com',
  address: '1423 54th St, Brooklyn NY 11219',
  emergencyContact: 'Moshe Levitz (Father)', emergencyPhone: '718-555-0101'
}
initialStudents.find(s => s.id === 6).medical = {
  allergies: [{ name: 'Penicillin', severity: 'severe' }, { name: 'Tree nuts', severity: 'moderate' }],
  medications: [{ name: 'Ritalin', dosage: '10mg', frequency: 'Daily morning' }],
  conditions: ['ADHD', 'Sensory Processing Disorder'],
  doctorName: 'Dr. Shmuel Katz', doctorPhone: '718-555-9876', lastPhysical: '2025-09-15', notes: 'Needs sensory breaks. Has OT IEP.'
}
initialStudents.find(s => s.id === 1).family = {
  fatherName: 'Yisrael Bloom', fatherPhone: '718-555-0201', fatherEmail: 'ybloom@email.com',
  motherName: 'Chana Bloom', motherPhone: '718-555-0202', motherEmail: '',
  address: '1567 48th St, Brooklyn NY 11219',
  emergencyContact: 'Yisrael Bloom (Father)', emergencyPhone: '718-555-0201'
}
initialStudents.find(s => s.id === 1).medical = {
  allergies: [{ name: 'Shellfish', severity: 'mild' }],
  medications: [],
  conditions: ['Speech delay'],
  doctorName: 'Dr. Rachel Stern', doctorPhone: '718-555-8765', lastPhysical: '2025-08-20', notes: 'Speech therapy twice weekly.'
}
initialStudents.find(s => s.id === 3).family = {
  fatherName: 'Yaakov Haddad', fatherPhone: '718-555-0301', fatherEmail: 'yhaddad@email.com',
  motherName: 'Leah Haddad', motherPhone: '718-555-0302', motherEmail: 'lhaddad@email.com',
  address: '892 Ocean Pkwy, Brooklyn NY 11230',
  emergencyContact: 'Yaakov Haddad (Father)', emergencyPhone: '718-555-0301'
}
initialStudents.find(s => s.id === 3).medical = {
  allergies: [{ name: 'Latex', severity: 'moderate' }, { name: 'Bee stings', severity: 'severe' }],
  medications: [{ name: 'EpiPen', dosage: '0.3mg', frequency: 'As needed' }, { name: 'Prozac', dosage: '10mg', frequency: 'Daily' }],
  conditions: ['Anxiety', 'Bee sting allergy - carries EpiPen'],
  doctorName: 'Dr. Avigdor Weiss', doctorPhone: '718-555-7654', lastPhysical: '2025-10-01', notes: 'EpiPen in office at all times. Counseling weekly.'
}

// Sample class logs for other students
initialStudents.find(s => s.id === 1).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:50', type: 'out', note: 'Left with Mrs. Goldberg (Speech)', staffId: 's6' },
  { time: '11:35', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 3).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:25', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
  { time: '11:25', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:00', type: 'out', note: 'Location unknown', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 8).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '11:20', type: 'out', note: 'Left with Mrs. Friedman (Counseling)', staffId: 's8' },
  { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 12).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:30', type: 'out', note: 'Left with Ezriel (BT)', staffId: 's10' },
  { time: '10:55', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:15', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
  { time: '11:50', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 14).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:15', type: 'out', note: 'Left with Yitzi Liebowitz (Therapy)', staffId: 's9' },
  { time: '11:00', type: 'in', note: 'Returned to class', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]
initialStudents.find(s => s.id === 18).classLog = [
  { time: '10:10', type: 'in', note: 'Arrived to class', staffId: null },
  { time: '10:40', type: 'out', note: 'Left with Dovid (BT)', staffId: 's11' },
  { time: '11:10', type: 'in', note: 'Returned to class', staffId: null },
  { time: '11:30', type: 'out', note: 'Location unknown', staffId: null },
  { time: '12:05', type: 'end', note: 'End of morning session', staffId: null },
  { time: '13:45', type: 'in', note: 'English class started', staffId: null },
  { time: '14:25', type: 'end', note: 'End of English', staffId: null },
]

const statusColor = { present: '#2563eb', absent: '#dc2626', late: '#d97706', therapy: '#7c3aed', 'with-bt': '#0891b2', unknown: '#6b7280', 'not-arrived': '#9ca3af' }
const statusLabel = { present: 'Present', absent: 'Absent', late: 'Late', therapy: 'In Therapy', 'with-bt': 'With BT', unknown: 'Location Unknown', 'not-arrived': 'Not Arrived' }
const statusEmoji = { present: '✅', absent: '❌', late: '⏰', therapy: '🧠', 'with-bt': '👤', unknown: '❓', 'not-arrived': '🕐' }

function daysSince(dateStr) { return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000) }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b','#713f12','#4c1d95','#164e63','#831843','#14532d','#7c2d12','#1e3a5f','#374151','#1e4d2b']

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function LiveClock() {
  const now = useNow()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const day = days[now.getDay()]
  const date = `${day}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return <span style={{ color: '#6b7280', fontSize: 13 }}>{date} · {time}</span>
}

function getImprovement(s) {
  if (s.lastWeekReminders === 0 && s.reminders === 0) return { label: 'No reminders', color: '#16a34a', icon: '✅' }
  if (s.reminders < s.lastWeekReminders) return { label: `Improved (${s.lastWeekReminders}→${s.reminders})`, color: '#16a34a', icon: '📈' }
  if (s.reminders > s.lastWeekReminders) return { label: 'More reminders', color: '#dc2626', icon: '📉' }
  return { label: 'Same as last week', color: '#d97706', icon: '➡️' }
}

function isVIP(s) { return s.reminders === 0 && s.att.every(d => d === 'P') }

const S = {
  app: { fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: '100vh', background: '#f4f5f7', color: '#1a1a2e', display: 'flex' },
  sidebar: { width: 220, background: '#1a1f36', color: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 },
  sidebarItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', borderRadius: 6, margin: '1px 8px', background: active ? 'rgba(255,255,255,0.12)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13.5, fontWeight: active ? 600 : 400 }),
  main: { marginLeft: 220, padding: '32px 120px 32px 36px', minHeight: '100vh', flex: 1, width: 'calc(100% - 220px)', boxSizing: 'border-box' },
  card: { background: '#fff', borderRadius: 10, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e8eaed' },
  statCard: (color) => ({ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8eaed', borderTop: `3px solid ${color}` }),
  badge: (color, bg) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg }),
  btn: (variant) => {
    const map = { primary: ['#1a1f36','#fff'], danger: ['#dc2626','#fff'], ghost: ['#f4f5f7','#374151'], success: ['#166534','#fff'], purple: ['#5b21b6','#fff'], gold: ['#854d0e','#fef9c3'] }
    return { padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: map[variant][0], color: map[variant][1] }
  },
  tag: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + '15', color, border: `1px solid ${color}30` }),
  avatar: (idx, size = 36) => ({ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size > 30 ? 13 : 10, flexShrink: 0 }),
}

function DrillDown({ title, students, onClose, onSelectStudent }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: '#1a1f36', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{title} <span style={{ opacity: 0.6, fontSize: 13 }}>({students.length})</span></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {students.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No students</div>}
          {students.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const vip = isVIP(s)
            return (
              <div key={s.id} onClick={() => onSelectStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8, cursor: 'pointer', background: '#fafafa' }}>
                <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.name}{vip && <span style={{ background: '#854d0e', color: '#fef9c3', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>⭐ VIP</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>remind.</div></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const [role, setRole] = useState('admin')
  const [emailInput, setEmailInput] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(false)
  const accounts = [
    { role: 'admin', name: 'Rabbi Baum', email: 'rbaum@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Ehrnreich', email: 'rehrnreich@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Weiss', email: 'rweiss@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Fried', email: 'rfried@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Blau', email: 'rblau@hadranacademy.org' },
    { role: 'admin', name: 'Rabbi Abramowitz', email: 'rabramowitz@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Klein', email: 'rklein@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Goldstein', email: 'rgoldstein@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Lefkowitz', email: 'rlefkowitz@hadranacademy.org' },
    { role: 'teacher', name: 'Rabbi Ambush', email: 'rambush@hadranacademy.org' },
    { role: 'therapist', name: 'Yitzi Liebowitz', email: 'yliebowitz@hadranacademy.org' },
    { role: 'therapist', name: 'Mrs. Goldberg', email: 'mgoldberg@hadranacademy.org' },
  ]
  const filtered = emailInput.length > 1 ? accounts.filter(a => a.email.toLowerCase().includes(emailInput.toLowerCase()) || a.name.toLowerCase().includes(emailInput.toLowerCase())) : []
  function selectAccount(acc) { setEmailInput(acc.email); setRole(acc.role); setShowSuggestion(false) }
  function handleLogin() {
    const acc = accounts.find(a => a.email === emailInput) || accounts.find(a => a.role === role)
    if (acc) onLogin(acc.role, acc.name)
  }
  return (
    <div style={{ minHeight: '100vh', background: '#1a1f36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', width: 820, display: 'flex', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ flex: 1, padding: '52px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1f36' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>Hadran<br/>Academy</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>Student Management System</div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            {[['🎓','Menahel Dashboard'],['👨‍🏫','Teacher Portal'],['🧠','Therapist Access'],['🛒','Canteen Store']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}><span>{icon}</span><span>{label}</span></div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f36', marginBottom: 4 }}>Welcome Back</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>Sign in to your account</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign in as</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['admin','Menahel/Admin'],['teacher','Teacher'],['therapist','Therapist']].map(([r, label]) => (
                <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '9px 6px', borderRadius: 6, border: `2px solid ${role === r ? '#1a1f36' : '#e5e7eb'}`, background: role === r ? '#1a1f36' : '#fff', color: role === r ? '#fff' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</div>
            <input value={emailInput} onChange={e => { setEmailInput(e.target.value); setShowSuggestion(true) }} onFocus={() => setShowSuggestion(true)} placeholder="Start typing your name or email..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
            {showSuggestion && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' }}>
                {filtered.map((acc, i) => (
                  <div key={i} onClick={() => selectAccount(acc)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f4f5f7', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = '#f4f5f7'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{acc.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</div>
            <input type="password" defaultValue="••••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1a1f36', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Sign In →</button>
          <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Need help? Contact admin@hadranacademy.org</div>
        </div>
      </div>
    </div>
  )
}

// ── TRACKING TAB COMPONENT ────────────────────────────────────────────────────
function TrackingTab({ s, students }) {
  const [period, setPeriod] = useState('today')
  const [drillType, setDrillType] = useState(null) // 'in', 'out', or a date string
  const student = students.find(x => x.id === s.id) || s
  const histData = HISTORICAL_DATA[student.id] || []

  const filterData = () => {
    const now = new Date()
    const today = now.toISOString().slice(0,10)
    switch(period) {
      case 'today': return histData.filter(d => d.date === today).length > 0 ? histData.filter(d => d.date === today) : histData.slice(0,1)
      case 'week': { const weekAgo = new Date(now - 7*86400000).toISOString().slice(0,10); return histData.filter(d => d.date >= weekAgo) }
      case 'month': { const monthAgo = new Date(now - 30*86400000).toISOString().slice(0,10); return histData.filter(d => d.date >= monthAgo) }
      case 'thismonth': return histData.filter(d => d.date.startsWith(now.toISOString().slice(0,7)))
      case 'year': return histData.filter(d => d.date.startsWith(new Date().getFullYear().toString()))
      default: return histData
    }
  }

  const data = filterData()
  const totalIn = data.reduce((acc, d) => acc + d.inMins, 0)
  const totalOut = data.reduce((acc, d) => acc + d.outMins, 0)
  const avgPct = data.length > 0 ? Math.round(totalIn / (totalIn + totalOut) * 100) : 0
  const pctColor = avgPct >= 70 ? '#16a34a' : avgPct >= 50 ? '#d97706' : '#dc2626'
  const staffTime = {}
  data.forEach(d => { if (d.staffName) staffTime[d.staffName] = (staffTime[d.staffName] || 0) + d.outMins })

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'Last 30 Days' },
    { id: 'thismonth', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ]

  if (histData.length === 0) {
    return (
      <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>
        No class tracking data yet for this student.
        <br/><span style={{ fontSize: 12 }}>Data records automatically when teacher uses the Teaching Mode toggle.</span>
      </div>
    )
  }

  // Drill-down popup
  const DrillDownPopup = () => {
    if (!drillType) return null
    const isDateDrill = drillType !== 'in' && drillType !== 'out' && drillType !== 'late'
    const isIn = drillType === 'in'

    // Late drill-down
    if (drillType === 'late') {
      const lateDays = DAYS.map((day, i) => ({ day, i, status: student.att?.[i] })).filter(d => d.status === 'L' || d.status === 'LE')
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#d97706', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>⏰ Late Days — {student.name}</div>
              <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              {lateDays.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No late days this week</div>
              ) : lateDays.map((d, i) => {
                const fullDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
                const lateDetail = student.lateDetails
                return (
                  <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{fullDays[d.i]}</div>
                      <span style={S.badge('#92400e', '#fef3c7')}>{d.status === 'LE' ? '🚪 Left Early' : '⏰ Late'}</span>
                    </div>
                    {lateDetail?.timeArrived && <div style={{ fontSize: 13, color: '#374151' }}>⏰ Arrived: <strong>{lateDetail.timeArrived}</strong></div>}
                    {lateDetail?.reason && lateDetail.reason !== 'no-reason' && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                        {lateDetail.reason === 'parent-called' ? '📞 Parent called ahead' : lateDetail.reason === 'sick' ? '🤒 Sick' : lateDetail.reason === 'transport' ? '🚌 Transport issue' : lateDetail.reason === 'appointment' ? '🏥 Appointment' : lateDetail.reason}
                      </div>
                    )}
                    {lateDetail?.note && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontStyle: 'italic' }}>"{lateDetail.note}"</div>}
                    {!lateDetail?.timeArrived && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>No details recorded</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    if (isDateDrill && drillType !== 'late') {
      // Show specific day breakdown
      const dayData = histData.find(d => d.date === drillType) || data[0]
      const dayName = dayData ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(dayData.date).getDay()] : ''
      const todayLog = student.classLog || []
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background: '#1a1f36', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>📅 {dayName} {drillType} — {student.name}</div>
              <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {dayData && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{dayData.inMins}m</div><div style={{ fontSize: 11, color: '#16a34a' }}>In Class</div></div>
                    <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{dayData.outMins}m</div><div style={{ fontSize: 11, color: '#dc2626' }}>Out</div></div>
                    <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: dayData.pct >= 70 ? '#16a34a' : '#d97706' }}>{dayData.pct}%</div><div style={{ fontSize: 11, color: '#6b7280' }}>In Class</div></div>
                  </div>
                  {dayData.staffName && <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>👤 Out with: <strong>{dayData.staffName}</strong></div>}
                  {todayLog.length > 0 && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Timeline:</div>
                      {todayLog.map((ev, i) => {
                        const staffObj = ev.staffId ? STAFF.find(st => st.id === ev.staffId) : null
                        const period = SCHEDULE_PERIODS.find(p => { if (p.type !== 'class') return false; const [sh, sm] = p.time.split(' - ')[0].split(':').map(Number); const [eh, em] = p.time.split(' - ')[1].split(':').map(Number); const [ch, cm] = ev.time.split(':').map(Number); return (ch*60+cm) >= (sh*60+sm) && (ch*60+cm) <= (eh*60+em) })
                        return (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f4f5f7', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 12, color: '#6b7280', minWidth: 44 }}>{ev.time}</span>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.type === 'in' ? '#16a34a' : '#dc2626', marginTop: 3, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: ev.type === 'in' ? '#166534' : '#dc2626' }}>{ev.note}</div>
                              {period && <div style={{ fontSize: 11, color: '#6b7280' }}>📚 {period.subject} · {period.teachers[0]}</div>}
                              {staffObj && <div style={{ fontSize: 11, color: '#7c3aed' }}>👤 {staffObj.name} — {staffObj.role}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )
    }
    const title = isIn ? '✅ Time In Class' : '🚪 Time Out of Class'

    // Build per-day, per-period breakdown from classLog + histData
    const breakdownData = data.map(d => ({
      date: d.date,
      mins: isIn ? d.inMins : d.outMins,
      staff: isIn ? null : d.staffName,
      pct: d.pct
    }))

    // For today's log breakdown by actual events
    const todayLog = student.classLog || []
    const hasDetailedLog = period === 'today' && todayLog.length > 0

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ background: isIn ? '#166534' : '#dc2626', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{title} — {student.name}</div>
            <button onClick={() => setDrillType(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: isIn ? '#166534' : '#dc2626', marginBottom: 12 }}>
              Total: {isIn ? totalIn : totalOut} min across {data.length} day{data.length !== 1 ? 's' : ''}
            </div>

            {/* Detailed log for today */}
            {hasDetailedLog && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase' }}>Today's Timeline</div>
                {todayLog.filter(e => isIn ? e.type === 'in' : e.type === 'out').map((ev, i) => {
                  const next = todayLog[todayLog.indexOf(ev) + 1]
                  const staffObj = ev.staffId ? STAFF.find(st => st.id === ev.staffId) : null
                  const [ch, cm] = ev.time.split(':').map(Number)
                  const mins = next ? (() => { const [nh, nm] = next.time.split(':').map(Number); return (nh*60+nm)-(ch*60+cm) })() : null
                  // Find which class period this falls in
                  const period = SCHEDULE_PERIODS.find(p => {
                    const [sh, sm] = p.time.split(' - ')[0].split(':').map(Number)
                    const [eh, em] = p.time.split(' - ')[1].split(':').map(Number)
                    return p.type === 'class' && (ch*60+cm) >= (sh*60+sm) && (ch*60+cm) <= (eh*60+em)
                  })
                  return (
                    <div key={i} style={{ background: isIn ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.time} — {ev.note}</div>
                        {period && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>📚 {period.subject} · {period.teachers[0]}</div>}
                        {staffObj && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>👤 {staffObj.name} — {staffObj.role}</div>}
                      </div>
                      {mins !== null && <div style={{ fontWeight: 700, fontSize: 14, color: isIn ? '#16a34a' : '#dc2626' }}>{mins} min</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Per-day breakdown */}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase' }}>By Day</div>
            {breakdownData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f4f5f7' }}>
                <div style={{ minWidth: 80, fontSize: 12, color: '#6b7280' }}>{d.date}</div>
                <div style={{ flex: 1, height: 6, background: '#f4f5f7', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, d.mins/120*100)}%`, height: '100%', background: isIn ? '#16a34a' : '#dc2626' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: isIn ? '#16a34a' : '#dc2626', minWidth: 50, textAlign: 'right' }}>{d.mins} min</div>
                {!isIn && d.staff && <div style={{ fontSize: 11, color: '#7c3aed', minWidth: 80 }}>👤 {d.staff}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {drillType && <DrillDownPopup />}

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '6px 12px', borderRadius: 6, border: `2px solid ${period === p.id ? '#1a1f36' : '#e5e7eb'}`, background: period === p.id ? '#1a1f36' : '#fff', color: period === p.id ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
        ))}
      </div>

      {data.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No data for this period</div>
      ) : (
        <>
          {/* Clickable summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div onClick={() => setDrillType('in')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #16a34a', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{totalIn} min</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>In Class</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>click for details →</div>
            </div>
            <div onClick={() => setDrillType('out')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #dc2626', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{totalOut} min</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Out of Class</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>click for details →</div>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderTop: `3px solid ${pctColor}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: pctColor }}>{avgPct}%</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Avg In Class</div>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #7c3aed' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{data.length}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Days Tracked</div>
            </div>
            <div onClick={() => setDrillType('late')} style={{ ...S.card, textAlign: 'center', borderTop: '3px solid #d97706', cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform='none'}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{student.att ? student.att.filter(d => d === 'L' || d === 'LE').length : 0}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Times Late</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>click for details →</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Overall Time Split</div>
            <div style={{ height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
              <div style={{ width: `${avgPct}%`, background: '#16a34a' }} />
              <div style={{ flex: 1, background: '#fca5a5' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>🟢 In class: {avgPct}%</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>🔴 Out: {100-avgPct}%</span>
            </div>
          </div>

          {/* Staff time */}
          {Object.keys(staffTime).length > 0 && (
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>👤 Time Out — By Staff Member</div>
              {Object.entries(staffTime).sort((a,b) => b[1]-a[1]).map(([name, mins]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f4f5f7' }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>👤 {name}</span>
                  <div style={{ width: 120, height: 6, background: '#f4f5f7', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, mins/totalOut*100)}%`, height: '100%', background: '#7c3aed', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', minWidth: 50, textAlign: 'right' }}>{mins} min</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily breakdown — clickable rows */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📅 Daily Breakdown <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(click any day for details)</span></div>
            {data.map((d, i) => {
              const color = d.pct >= 70 ? '#16a34a' : d.pct >= 50 ? '#d97706' : '#dc2626'
              const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d.date).getDay()]
              // Find which teacher was teaching that day based on day of week
              const dayIdx = new Date(d.date).getDay()
              const periodTeachers = SCHEDULE_PERIODS.filter(p => p.type === 'class').map(p => p.teachers[0]).filter(Boolean)
              return (
                <div key={i} onClick={() => setDrillType(d.date)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ minWidth: 100, fontSize: 12, fontWeight: 500 }}>
                    <span style={{ fontWeight: 800, color: '#374151' }}>{dayName}</span>
                    <span style={{ color: '#6b7280', marginLeft: 4 }}>{d.date}</span>
                  </div>
                  <div style={{ flex: 1, height: 8, background: '#f4f5f7', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${d.pct}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                  <div style={{ minWidth: 36, fontSize: 13, fontWeight: 800, color, textAlign: 'right' }}>{d.pct}%</div>
                  <div style={{ minWidth: 110, fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>{d.inMins}m</span> in / <span style={{ color: '#dc2626', fontWeight: 600 }}>{d.outMins}m</span> out
                  </div>
                  {d.staffName && <div style={{ fontSize: 11, color: '#7c3aed', minWidth: 90 }}>👤 {d.staffName}</div>}
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>→</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function FamilyEditorPopup({ s, setStudents }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(s.family || {})
  function save() { setStudents(prev => prev.map(x => x.id === s.id ? { ...x, family: f } : x)); setOpen(false) }
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>✏️ Edit Family Info</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#1a1f36', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>✏️ Edit Family Info — {s.name}</div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {[['fatherName','Father Name'],['fatherPhone','Father Phone'],['fatherEmail','Father Email'],['motherName','Mother Name'],['motherPhone','Mother Phone'],['motherEmail','Mother Email']].map(([key, label]) => (
                  <input key={key} placeholder={label} value={f[key]||''} onChange={e => setF(prev => ({...prev, [key]: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                ))}
              </div>
              <input placeholder="Home Address" value={f.address||''} onChange={e => setF(prev => ({...prev, address: e.target.value}))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <input placeholder="Emergency Contact" value={f.emergencyContact||''} onChange={e => setF(prev => ({...prev, emergencyContact: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                <input placeholder="Emergency Phone" value={f.emergencyPhone||''} onChange={e => setF(prev => ({...prev, emergencyPhone: e.target.value}))} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setOpen(false)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={save} style={{ ...S.btn('primary'), flex: 1 }}>💾 Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FamilyEditor({ s, setStudents }) {
  const [f, setF] = useState(s.family || {})
  function save() { setStudents(prev => prev.map(x => x.id === s.id ? { ...x, family: f } : x)) }
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Edit Family Info</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['fatherName','Father Name'],['fatherPhone','Father Phone'],['fatherEmail','Father Email'],['motherName','Mother Name'],['motherPhone','Mother Phone'],['motherEmail','Mother Email']].map(([key, label]) => (
          <input key={key} placeholder={label} value={f[key]||''} onChange={e => setF(prev => ({...prev, [key]: e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
        ))}
        <input placeholder="Home Address" value={f.address||''} onChange={e => setF(prev => ({...prev, address: e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, gridColumn: 'span 2', boxSizing: 'border-box' }} />
        <input placeholder="Emergency Contact" value={f.emergencyContact||''} onChange={e => setF(prev => ({...prev, emergencyContact: e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
        <input placeholder="Emergency Phone" value={f.emergencyPhone||''} onChange={e => setF(prev => ({...prev, emergencyPhone: e.target.value}))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
      </div>
      <button onClick={save} style={{ ...S.btn('primary'), marginTop: 8, padding: '6px 14px', fontSize: 12 }}>Save</button>
    </div>
  )
}

function StudentProfile({ student, students, setStudents, onClose, role, defaultTab = 'overview' }) {
  const [tab, setTab] = useState(defaultTab)
  const [noteText, setNoteText] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [callStaff, setCallStaff] = useState('Rabbi Klein')
  const [callDuration, setCallDuration] = useState('')
  const s = students.find(x => x.id === student.id)
  const improvement = getImprovement(s)
  const vip = isVIP(s)
  const absCount = s.att.filter(d => d === 'A').length
  const lateCount = s.att.filter(d => d === 'L').length
  const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
  const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null

  function addNote() { if (!noteText.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, notes: [...x.notes, { date: new Date().toISOString().slice(0,10), author: callStaff, text: noteText }] } : x)); setNoteText('') }
  function addCall() { if (!callNotes.trim()) return; setStudents(prev => prev.map(x => x.id === s.id ? { ...x, parentCalls: [...x.parentCalls, { date: new Date().toISOString().slice(0,10), staff: callStaff, notes: callNotes, duration: callDuration }] } : x)); setCallNotes(''); setCallDuration('') }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: vip ? 'linear-gradient(135deg, #854d0e, #a16207)' : '#1a1f36', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={S.avatar(s.id - 1, 48)}>{initials(s.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {s.name}{vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>⭐ VIP</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ ...S.tag(statusColor[s.status]), fontSize: 11 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
              {withStaffObj && <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>👤 With {withStaffObj.name}</span>}
              {s.iep && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>📋 IEP</span>}
              {s.detention && <span style={{ background: 'rgba(220,38,38,0.3)', color: '#fca5a5', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>⚠️ Detention</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, color: '#fff', textAlign: 'center' }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>{s.points}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Points</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: s.reminders >= 6 ? '#f87171' : '#fff' }}>{s.reminders}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Reminders</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: '#f87171' }}>{absCount}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Absences</div></div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', padding: '0 24px', background: '#fafafa' }}>
          {['overview','attendance','tracking','behavior','therapy','calls','notes','info'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '2px solid #1a1f36' : '2px solid transparent', color: tab === t ? '#1a1f36' : '#6b7280', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: '#f4f5f7' }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {vip && <div style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #fef9c3, #fef08a)', border: '2px solid #ca8a04', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 32 }}>⭐</span><div><div style={{ fontWeight: 800, fontSize: 15, color: '#854d0e' }}>VIP Student!</div><div style={{ fontSize: 13, color: '#92400e' }}>Perfect week — eligible for VIP rewards!</div></div></div>}
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>This Week Summary</div>
                {[['Present days', s.att.filter(d=>d==='P').length+'/6'],['Late arrivals', lateCount],['Absences', absCount],['Points', s.points+' pts'],['Reminders', s.reminders],['Last call', lastCall ? daysSince(lastCall.date)+'d ago' : 'Never']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f5f7', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...S.card, borderLeft: `3px solid ${improvement.color}` }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>📈 vs Last Week</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: improvement.color }}>{improvement.icon} {improvement.label}</div>
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Attendance</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {DAYS.map((day, i) => (
                      <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{day}</div>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':'#dbeafe', color: s.att[i]==='P'?'#16a34a':s.att[i]==='A'?'#dc2626':'#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, margin: '0 auto' }}>{s.att[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {withStaffObj && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #0891b2' }}><div style={{ fontWeight: 700, color: '#0891b2', marginBottom: 4, fontSize: 13 }}>📍 Currently With</div><div style={{ fontSize: 14 }}><strong>{withStaffObj.name}</strong> — {withStaffObj.role}</div></div>}
              {s.status === 'unknown' && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #dc2626', background: '#fef2f2' }}><div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4, fontSize: 13 }}>❓ Location Unknown</div><div style={{ fontSize: 13, color: '#dc2626' }}>Student location is unaccounted for. Please locate immediately.</div></div>}
              {s.iep && <div style={{ ...S.card, gridColumn: 'span 2', borderLeft: '3px solid #7c3aed' }}><div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 4, fontSize: 13 }}>📋 IEP</div><div style={{ fontSize: 13 }}>{s.iepDetails}</div></div>}
            </div>
          )}
          {tab === 'attendance' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Attendance Record</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #e8eaed' }}><th style={{ textAlign: 'left', padding: 10 }}>Day</th><th style={{ padding: 10, textAlign: 'center' }}>Status</th><th style={{ padding: 10, textAlign: 'center' }}>Breakfast</th></tr></thead>
                <tbody>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'].map((day, i) => (
                    <tr key={day} style={{ borderBottom: '1px solid #f4f5f7' }}>
                      <td style={{ padding: 10 }}>{day}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <span style={S.badge(
                          s.att[i]==='P'?'#166534':s.att[i]==='A'?'#dc2626':s.att[i]==='LE'?'#5b21b6':'#1d4ed8',
                          s.att[i]==='P'?'#dcfce7':s.att[i]==='A'?'#fee2e2':s.att[i]==='LE'?'#f5f3ff':'#dbeafe'
                        )}>{s.att[i]==='P'?'Present':s.att[i]==='A'?'Absent':s.att[i]==='LE'?'Left Early':'Late'}</span>
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}><span style={S.badge(s.breakfast[i]==='Y'?'#166534':'#dc2626', s.breakfast[i]==='Y'?'#dcfce7':'#fee2e2')}>{s.breakfast[i]==='Y'?'✓ Breakfast':'✗ Skipped'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'tracking' && (
            <TrackingTab s={s} students={students} />
          )}

          {tab === 'behavior' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ ...S.statCard('#d97706'), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Points</div><div style={{ fontSize: 26, fontWeight: 800, color: '#d97706' }}>{s.points}</div></div>
                <div style={{ ...S.statCard('#dc2626'), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Reminders</div><div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>{s.reminders}</div></div>
                <div style={{ ...S.statCard(improvement.color), flex: 1 }}><div style={{ fontSize: 11, color: '#6b7280' }}>Trend</div><div style={{ fontSize: 13, fontWeight: 700, color: improvement.color, marginTop: 4 }}>{improvement.icon} {improvement.label}</div></div>
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Behavior Log</div>
                {s.behaviorLog.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13 }}>No events yet.</div> : s.behaviorLog.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f5f7', fontSize: 13 }}>
                    <span>{b.label}</span><span style={{ fontWeight: 700, color: b.points > 0 ? '#166534' : '#dc2626' }}>{b.points > 0 ? '+' : ''}{b.points}</span><span style={{ color: '#9ca3af' }}>{b.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'therapy' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Therapy & Services</div>
              {s.services.length === 0 ? <div style={{ color: '#9ca3af' }}>No therapy services assigned.</div> : s.services.map((svc, i) => {
                const staffMember = STAFF.find(st => st.id === svc.staffId)
                return <div key={i} style={{ background: '#f4f5f7', borderRadius: 8, padding: 14, marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{svc.type}</div><div style={{ color: '#6b7280', fontSize: 13 }}>With: <strong>{staffMember?.name}</strong></div><div style={{ color: '#5b21b6', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{svc.hrs} hrs/week</div></div>
              })}
            </div>
          )}
          {tab === 'calls' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📞 Parent Call Log</div>
              {s.parentCalls.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>No calls recorded yet.</div> : s.parentCalls.map((c, i) => (
                <div key={i} style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{c.staff}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{c.date} · {c.duration}</span></div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{c.notes}</div>
                </div>
              ))}
              {role !== 'therapist' && (
                <div style={{ marginTop: 14, borderTop: '1px solid #e8eaed', paddingTop: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Log a new call</div>
                  <input placeholder="Staff name" value={callStaff} onChange={e => setCallStaff(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <input placeholder="Duration (e.g. 5 min)" value={callDuration} onChange={e => setCallDuration(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  <textarea placeholder="Call notes..." value={callNotes} onChange={e => setCallNotes(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                  <button onClick={addCall} style={S.btn('primary')}>Log Call</button>
                </div>
              )}
            </div>
          )}
          {tab === 'notes' && (
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Staff Notes</div>
              {s.notes.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>No notes yet.</div> : s.notes.map((n, i) => (
                <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 12 }}>{n.author}</span><span style={{ color: '#9ca3af', fontSize: 12 }}>{n.date}</span></div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{n.text}</div>
                </div>
              ))}
              <div style={{ marginTop: 14, borderTop: '1px solid #e8eaed', paddingTop: 14 }}>
                <textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 13, minHeight: 70, boxSizing: 'border-box', resize: 'vertical' }} />
                <button onClick={addNote} style={S.btn('primary')}>Add Note</button>
              </div>
            </div>
          )}

          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Allergies alert */}
              {s.medical?.allergies?.length > 0 && (
                <div style={{ background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#dc2626', marginBottom: 8 }}>⚠️ ALLERGIES</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.medical.allergies.map((a, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: a.severity === 'severe' ? '#dc2626' : a.severity === 'moderate' ? '#d97706' : '#6b7280', color: '#fff' }}>
                        {a.name} — {a.severity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Family */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1a1f36' }}>👨‍👩‍👦 Family & Contact</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Father', s.family?.fatherName, s.family?.fatherPhone, s.family?.fatherEmail],
                    ['Mother', s.family?.motherName, s.family?.motherPhone, s.family?.motherEmail],
                  ].map(([label, name, phone, email]) => (
                    <div key={label} style={{ background: '#f4f5f7', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{name || '—'}</div>
                      {phone && <div style={{ fontSize: 13, color: '#2563eb' }}>📞 {phone}</div>}
                      {email && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>✉️ {email}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.family?.address && <div style={{ fontSize: 13, color: '#374151' }}>🏠 {s.family.address}</div>}
                  {s.family?.emergencyContact && <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>🚨 Emergency: {s.family.emergencyContact} · {s.family.emergencyPhone}</div>}
                </div>
                {role === 'admin' && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #e8eaed', paddingTop: 12 }}>
                    <FamilyEditorPopup s={s} setStudents={setStudents} />
                  </div>
                )}
              </div>

              {/* Medical */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#1a1f36' }}>🏥 Medical Information</div>
                {s.medical?.medications?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>💊 Medications</div>
                    {s.medical.medications.map((m, i) => (
                      <div key={i} style={{ background: '#f0f9ff', borderRadius: 6, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</span>
                          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{m.dosage}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.medical?.conditions?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase' }}>📋 Conditions</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.medical.conditions.map((c, i) => <span key={i} style={S.badge('#5b21b6', '#f5f3ff')}>{c}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {s.medical?.doctorName && <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>DOCTOR</div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.medical.doctorName}</div>{s.medical.doctorPhone && <div style={{ fontSize: 12, color: '#2563eb' }}>📞 {s.medical.doctorPhone}</div>}</div>}
                  {s.medical?.lastPhysical && <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>LAST PHYSICAL</div><div style={{ fontWeight: 600, fontSize: 13 }}>{s.medical.lastPhysical}</div></div>}
                </div>
                {s.medical?.notes && <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>📝 {s.medical.notes}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeachingMode({ students, setStudents, onExit, isAdmin, initialClass = null }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [leavePopup, setLeavePopup] = useState(null)
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')
  const [selectedClass, setSelectedClass] = useState(initialClass)
  const [lateClassPopup, setLateClassPopup] = useState(null) // studentId
  const [lateClassStaffSearch, setLateClassStaffSearch] = useState('')
  const [lateClassStaffId, setLateClassStaffId] = useState('')
  const [lateClassNote, setLateClassNote] = useState('')

  // Session + intervals
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [intervalNum, setIntervalNum] = useState(1)
  const [intervalSeconds, setIntervalSeconds] = useState(0)
  const INTERVAL_DURATION = 20 * 60 // 20 minutes
  const [intervalHistory, setIntervalHistory] = useState([])
  const [intervalReminders, setIntervalReminders] = useState({}) // {studentId: reminders this interval}
  const [showSummary, setShowSummary] = useState(false)

  // Timer
  useEffect(() => {
    if (!sessionActive) return
    const t = setInterval(() => {
      setIntervalSeconds(prev => {
        if (prev + 1 >= INTERVAL_DURATION) {
          // Auto chime - move to next interval
          playSound('store')
          nextInterval()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [sessionActive, intervalNum])

  function startSession() {
    setSessionActive(true)
    setSessionStartTime(new Date())
    setIntervalNum(1)
    setIntervalSeconds(0)
    setIntervalReminders({})
    setIntervalHistory([])
  }

  function nextInterval() {
    playSound('store')
    // Save this interval's data
    setIntervalHistory(prev => [...prev, {
      interval: intervalNum,
      reminders: { ...intervalReminders },
      duration: intervalSeconds
    }])
    setIntervalNum(prev => prev + 1)
    setIntervalSeconds(0)
    setIntervalReminders({}) // Fresh start - reminders reset
  }

  function endSession() {
    // Save last interval
    setIntervalHistory(prev => [...prev, {
      interval: intervalNum,
      reminders: { ...intervalReminders },
      duration: intervalSeconds
    }])
    setSessionActive(false)
    setShowSummary(true)
  }

  function addIntervalReminder(studentId) {
    playSound('negative')
    setIntervalReminders(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + 1 }))
    // Only update total reminders on student if this interval pushes them over
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      behaviorLog: [{ label: `Reminder (Interval ${intervalNum})`, points: -1, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 30)
    } : s))
  }

  const filteredStaff = leaveStaffSearch.length > 0 ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase())) : STAFF

  const classStudents = selectedClass
    ? students.filter(s => STUDENT_CLASSES[s.id] === selectedClass)
    : students
  const filtered = classStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  function toggleSelect(id) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function applyToSelected(amount, label) {
    playSound(amount > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => selected.includes(s.id) ? { ...s, points: Math.max(0, s.points + amount), reminders: amount < 0 ? s.reminders + 1 : s.reminders, behaviorLog: [{ label, points: amount, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
    setSelected([])
  }

  function handleToggle(s) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    if (s.status === 'present') {
      setLeavePopup(s.id); setLeaveReason('therapy'); setLeaveStaffSearch(''); setLeaveStaffId('')
    } else {
      setStudents(prev => prev.map(x => x.id === s.id ? {
        ...x, status: 'present', withStaff: null,
        classLog: [...(x.classLog || []), { time: timeStr, type: 'in', note: 'Returned to class', staffId: null }]
      } : x))
    }
  }

  function confirmLeave() {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const statusMap = { therapy: 'therapy', 'with-bt': 'with-bt', menahel: 'present', unknown: 'unknown', other: 'unknown' }
    const staffObj = leaveStaffId ? STAFF.find(st => st.id === leaveStaffId) : null
    const note = staffObj ? `Left with ${staffObj.name} (${staffObj.role})` : leaveReason === 'unknown' ? 'Location unknown' : 'Left class'
    setStudents(prev => prev.map(x => x.id === leavePopup ? {
      ...x, status: statusMap[leaveReason] || 'unknown', withStaff: leaveStaffId || null,
      classLog: [...(x.classLog || []), { time: timeStr, type: 'out', note, staffId: leaveStaffId || null }]
    } : x))
    setLeavePopup(null)
  }

  const mins = Math.floor(intervalSeconds / 60)
  const secs = intervalSeconds % 60
  const progress = (intervalSeconds / INTERVAL_DURATION) * 100

  // Summary screen
  if (showSummary) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f4f5f7', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#1a1f36', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>📊 Session Summary</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowSummary(false); setSessionActive(false); setIntervalNum(1); setIntervalSeconds(0); setIntervalHistory([]); setIntervalReminders({}) }} style={S.btn('ghost')}>🔄 New Session</button>
            <button onClick={onExit} style={S.btn('danger')}>← Exit</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${intervalHistory.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
              {intervalHistory.map((iv, i) => (
                <div key={i} style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#1a1f36' }}>Interval {iv.interval}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>{Math.floor(iv.duration/60)} min {iv.duration%60} sec</div>
                  {Object.keys(iv.reminders).length === 0 
                    ? <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ No reminders!</div>
                    : Object.entries(iv.reminders).map(([id, count]) => {
                        const s = students.find(x => x.id === parseInt(id))
                        return <div key={id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f4f5f7' }}><span style={{ fontWeight: 600 }}>{s?.name}</span>: <span style={{ color: '#dc2626', fontWeight: 700 }}>{count} ⚠️</span></div>
                      })
                  }
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🏆 Student Performance Across Intervals</div>
              {filtered.map((s, i) => {
                const totalReminders = intervalHistory.reduce((acc, iv) => acc + (iv.reminders[s.id] || 0), 0)
                const cleanIntervals = intervalHistory.filter(iv => !iv.reminders[s.id]).length
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f4f5f7' }}>
                    <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {intervalHistory.map((iv, j) => (
                        <div key={j} style={{ width: 28, height: 28, borderRadius: 6, background: iv.reminders[s.id] ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: iv.reminders[s.id] ? '#dc2626' : '#16a34a' }}>
                          {iv.reminders[s.id] ? iv.reminders[s.id] : '✓'}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: totalReminders === 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                      {totalReminders === 0 ? '⭐ Perfect' : `${totalReminders} total`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f4f5f7', zIndex: 200, display: 'flex', flexDirection: 'column' }}>

      {/* Late to Class Popup */}
      {lateClassPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#d97706', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>⏰ {students.find(s=>s.id===lateClassPopup)?.name} — Late to Class</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Why was he late to this class?</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Was with staff member?</div>
              <input value={lateClassStaffSearch} onChange={e => { setLateClassStaffSearch(e.target.value); setLateClassStaffId('') }} placeholder="Start typing name (Rabbi Ehrnreich, Rabbi Baum...)" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 }} />
              {lateClassStaffSearch.length > 0 && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                  {[...STAFF, { id: 's1', name: 'Rabbi Baum', role: 'Menahel' }, { id: 's2', name: 'Rabbi Ehrnreich', role: 'Sgan Menahel' }]
                    .filter((st, i, arr) => arr.findIndex(x => x.id === st.id) === i)
                    .filter(st => st.name.toLowerCase().includes(lateClassStaffSearch.toLowerCase()))
                    .slice(0, 6)
                    .map(st => (
                      <div key={st.id} onClick={() => { setLateClassStaffId(st.id); setLateClassStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: lateClassStaffId === st.id ? '#f4f5f7' : '#fff', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{st.name}</span>
                        <span style={{ color: '#6b7280', fontSize: 11 }}>{st.role}</span>
                      </div>
                    ))}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Note (optional)</div>
              <input value={lateClassNote} onChange={e => setLateClassNote(e.target.value)} placeholder="e.g. was asked to come speak with Menahel" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLateClassPopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={() => {
                  const now = new Date()
                  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                  const staffObj = lateClassStaffId ? STAFF.find(st => st.id === lateClassStaffId) : null
                  const note = staffObj ? `Came late — was with ${staffObj.name}${lateClassNote ? `: ${lateClassNote}` : ''}` : lateClassNote ? `Came late — ${lateClassNote}` : 'Came late to class'
                  setStudents(prev => prev.map(x => x.id === lateClassPopup ? {
                    ...x, status: 'present',
                    classLog: [...(x.classLog||[]), { time: timeStr, type: 'in', note, staffId: lateClassStaffId || null }]
                  } : x))
                  setLateClassPopup(null); setLateClassStaffSearch(''); setLateClassStaffId(''); setLateClassNote('')
                }} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave popup */}
      {leavePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#1a1f36', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>🚪 {students.find(s=>s.id===leavePopup)?.name} is leaving class</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[['therapy','🧠 Therapy'],['with-bt','👤 With BT'],['menahel','🎓 Called to Menahel'],['unknown','❓ Location Unknown'],['other','📝 Other']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#1a1f36' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f4f5f7' : '#fff' }}>
                    <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                    <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 13 }}>{label}</span>
                  </label>
                ))}
              </div>
              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>With whom?</div>
                  <input value={leaveStaffSearch} onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }} placeholder="Start typing name..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 4 }} />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f4f5f7' : '#fff', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#6b7280', fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1a1f36', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{isAdmin ? '🎓 School-Wide Mode' : '🏫 Teaching Mode'}</div>

        {/* Class selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setSelectedClass(null)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${selectedClass === null ? '#fff' : 'rgba(255,255,255,0.3)'}`, background: selectedClass === null ? '#fff' : 'transparent', color: selectedClass === null ? '#1a1f36' : '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>All</button>
          {CLASSES.map(cls => (
            <button key={cls.id} onClick={() => setSelectedClass(cls.id)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${selectedClass === cls.id ? '#fff' : 'rgba(255,255,255,0.3)'}`, background: selectedClass === cls.id ? '#fff' : 'transparent', color: selectedClass === cls.id ? '#1a1f36' : '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{cls.name}</button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: '6px 10px', borderRadius: 6, border: 'none', fontSize: 12, width: 160, background: 'rgba(255,255,255,0.15)', color: '#fff' }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{filtered.filter(s=>s.status==='present').length}/{filtered.length} in class</div>

        {/* Session controls */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          {!sessionActive ? (
            <button onClick={startSession} style={{ ...S.btn('success'), padding: '6px 16px', fontSize: 13 }}>▶ Start Class</button>
          ) : (
            <>
              {/* Timer */}
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Interval {intervalNum}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: progress > 80 ? '#fbbf24' : '#fff', fontFamily: 'monospace' }}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress > 80 ? '#fbbf24' : '#22c55e', transition: 'width 1s' }} />
              </div>
              <button onClick={nextInterval} style={{ ...S.btn('ghost'), padding: '6px 14px', fontSize: 12 }}>🔔 Chime</button>
              <button onClick={endSession} style={{ ...S.btn('danger'), padding: '6px 14px', fontSize: 12 }}>⏹ End Session</button>
            </>
          )}
          <button onClick={() => setSelected(filtered.map(s => s.id))} style={{ ...S.btn('ghost'), padding: '5px 10px', fontSize: 11 }}>☑ All</button>
          <button onClick={() => setStudents(prev => prev.map(s => ({ ...s, status: 'present', withStaff: null })))} style={{ ...S.btn('ghost'), padding: '5px 10px', fontSize: 11 }}>✅ All Present</button>
          <button onClick={onExit} style={{ ...S.btn('danger'), padding: '5px 10px', fontSize: 11 }}>← Exit</button>
        </div>
      </div>

      {selected.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1f36' }}>{selected.length} selected:</div>
          {BEHAVIORS_POSITIVE.map(b => <button key={b.id} onClick={() => applyToSelected(b.points, b.label)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+{b.points} {b.label}</button>)}
          {BEHAVIORS_NEGATIVE.map(b => <button key={b.id} onClick={() => applyToSelected(b.points, b.label)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{b.points} {b.label}</button>)}
          <button onClick={() => applyToSelected(10, 'Bonus')} style={{ ...S.btn('success'), padding: '3px 10px', fontSize: 11 }}>+10</button>
          <button onClick={() => setSelected([])} style={{ ...S.btn('ghost'), padding: '3px 10px', fontSize: 11 }}>✕ Clear</button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtered.map((s, i) => {
            const isSelected = selected.includes(s.id)
            const vip = isVIP(s)
            const inClass = s.status === 'present'
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const thisIntervalReminders = intervalReminders[s.id] || 0
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : inClass ? '#fff' : '#fef2f2', border: `2px solid ${isSelected ? '#1a1f36' : vip ? '#ca8a04' : inClass ? '#e8eaed' : '#fecaca'}`, borderRadius: 10, padding: '12px', position: 'relative' }}>
                {vip && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 13 }}>⭐</div>}
                {sessionActive && thisIntervalReminders > 0 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>⚠️ {thisIntervalReminders}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleSelect(s.id)}>
                  <div style={{ ...S.avatar(i, 32), outline: isSelected ? '3px solid #1a1f36' : 'none' }}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {withStaffObj ? <div style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</div> : <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>

                <div style={{ display: 'flex', gap: 3, marginBottom: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+2, behaviorLog: [{label:'+2', points:2, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => { playSound('positive'); setStudents(prev => prev.map(x => x.id === s.id ? {...x, points: x.points+5, behaviorLog: [{label:'+5', points:5, date:new Date().toISOString().slice(0,10)}, ...x.behaviorLog]} : x)) }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => addIntervalReminder(s.id)} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f4f5f7' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: inClass ? '#166534' : '#dc2626' }}>{inClass ? '✅ In Class' : '🚪 Left'}</span>
                    {inClass && <button onClick={e => { e.stopPropagation(); setLateClassPopup(s.id); setLateClassStaffSearch(''); setLateClassStaffId(''); setLateClassNote('') }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>⏰ Came Late</button>}
                  </div>
                  <div onClick={() => handleToggle(s)} style={{ width: 40, height: 22, borderRadius: 11, background: inClass ? '#16a34a' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: inClass ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TeacherDashboard({ students, setStudents, userName, setSelectedStudent, setTeachingMode, initialClass = null, setDrillDown }) {
  const [selectedClass, setSelectedClass] = useState(initialClass)

  const classStudents = selectedClass
    ? students.filter(s => STUDENT_CLASSES[s.id] === selectedClass)
    : students

  const present = classStudents.filter(s => s.status === 'present').length
  const absent = classStudents.filter(s => s.status === 'absent').length
  const late = classStudents.filter(s => s.status === 'late').length
  const inTherapy = classStudents.filter(s => s.status === 'therapy').length
  const withBT = classStudents.filter(s => s.status === 'with-bt').length
  const unknown = classStudents.filter(s => s.status === 'unknown').length

  function quickPoints(id, amount) {
    playSound(amount > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => s.id === id ? { ...s, points: Math.max(0, s.points + amount), behaviorLog: [{ label: amount > 0 ? `+${amount} pts` : `${amount} pts`, points: amount, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
  }
  function quickReminder(id) {
    playSound('negative')
    setStudents(prev => prev.map(s => s.id === id ? { ...s, reminders: s.reminders + 1, behaviorLog: [{ label: 'Reminder', points: -1, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) } : s))
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>{classStudents.length} students</p>
      </div>

      {/* Class Selection */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>👨‍🏫 Which class are you teaching now?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedClass(null)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedClass === null ? '#1a1f36' : '#e5e7eb'}`, background: selectedClass === null ? '#1a1f36' : '#fff', color: selectedClass === null ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            📚 All Classes ({students.length})
          </button>
          {CLASSES.map(cls => {
            const count = students.filter(s => STUDENT_CLASSES[s.id] === cls.id).length
            const presentCount = students.filter(s => STUDENT_CLASSES[s.id] === cls.id && s.status === 'present').length
            return (
              <button key={cls.id} onClick={() => setSelectedClass(cls.id)} style={{ padding: '8px 16px', borderRadius: 8, border: `2px solid ${selectedClass === cls.id ? '#2563eb' : '#e5e7eb'}`, background: selectedClass === cls.id ? '#2563eb' : '#fff', color: selectedClass === cls.id ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🏫 {cls.name} ({presentCount}/{count})
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setTeachingMode(true)} style={{ ...S.btn('primary'), padding: '8px 20px', fontSize: 13 }}>▶ Start Class Session</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Present', present, '#2563eb', classStudents.filter(s=>s.status==='present')],
          ['Absent', absent, '#dc2626', classStudents.filter(s=>s.status==='absent')],
          ['Late', late, '#d97706', classStudents.filter(s=>s.status==='late')],
          ['Therapy', inTherapy, '#7c3aed', classStudents.filter(s=>s.status==='therapy')],
          ['With BT', withBT, '#0891b2', classStudents.filter(s=>s.status==='with-bt')],
          ['Unknown', unknown, '#dc2626', classStudents.filter(s=>s.status==='unknown')],
        ].map(([label, val, color, filtered]) => (
          <div key={label} onClick={() => (filtered as any[]).length > 0 && setDrillDown({ title: `${label}`, students: filtered as any[] })}
            style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e8eaed', textAlign: 'center', borderTop: `3px solid ${color}`, cursor: (filtered as any[]).length > 0 ? 'pointer' : 'default' }}
            onMouseEnter={e => { if ((filtered as any[]).length > 0) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
            <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Student cards */}
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 {selectedClass ? CLASSES.find(c=>c.id===selectedClass)?.name : 'All Students'} — Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {classStudents.map((s, i) => {
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            const vip = isVIP(s)
            return (
              <div key={s.id} style={{ background: vip ? '#fefce8' : s.status === 'unknown' ? '#fef2f2' : '#fafafa', border: `1px solid ${vip ? '#ca8a04' : s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                  <div style={S.avatar(i, 34)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}{vip && ' ⭐'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span style={{ ...S.tag(statusColor[s.status]), fontSize: 10 }}>{statusEmoji[s.status]}</span>
                      {withStaffObj && <span style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                  {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => quickPoints(s.id, 2)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+2</button>
                  <button onClick={() => quickPoints(s.id, 5)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+5</button>
                  <button onClick={() => quickPoints(s.id, 10)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+10</button>
                  <button onClick={() => quickReminder(s.id)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚠️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TherapistDashboard({ students, userName, setSelectedStudent }) {
  const myStudents = students.filter(s => s.services.length > 0)
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Good morning, {userName} 👋</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>Therapist Portal · Wednesday, June 4</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 My Students</div>
          {myStudents.map((s, i) => {
            const imp = getImprovement(s)
            return (
              <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}>
                <div style={S.avatar(i, 36)}>{initials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                    <span style={{ fontSize: 11, color: imp.color, fontWeight: 600 }}>{imp.icon}</span>
                  </div>
                </div>
                <div>{s.services.map((svc, j) => <div key={j} style={{ fontSize: 11, color: '#5b21b6', fontWeight: 600 }}>{svc.type}</div>)}</div>
              </div>
            )
          })}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📅 This Week's Sessions</div>
          {THERAPY_SCHEDULE.map((t, i) => {
            const staffMember = STAFF.find(st => st.id === t.staffId)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f4f5f7' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#5b21b6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{t.type} · {t.duration}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t.time}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── WEEKLY RECORD COMPONENT ──────────────────────────────────────────────────
function WeeklyRecord({ students, filteredStudents, openStudent }) {
  const [view, setView] = useState('daily')
  const dailyLabels = { 'P': 'P', 'A': 'A', 'L': 'L', 'LE': 'LE' }
  const dailyColors = {
    'P': ['#166534','#dcfce7'],
    'A': ['#dc2626','#fee2e2'],
    'L': ['#d97706','#dbeafe'],
    'LE': ['#5b21b6','#f5f3ff']
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>📊 Weekly Record</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setView('daily')} style={{ ...S.btn(view === 'daily' ? 'primary' : 'ghost'), padding: '5px 12px', fontSize: 12 }}>📅 Daily Attendance</button>
          <button onClick={() => setView('class')} style={{ ...S.btn(view === 'class' ? 'primary' : 'ghost'), padding: '5px 12px', fontSize: 12 }}>🏫 Class Attendance</button>
        </div>
      </div>

      {view === 'daily' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8eaed' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student</th>
              {DAYS.map(d => <th key={d} style={{ padding: 8, textAlign: 'center' }}>{d}</th>)}
              <th style={{ padding: 8, textAlign: 'center' }}>P</th>
              <th style={{ padding: 8, textAlign: 'center' }}>A</th>
              <th style={{ padding: 8, textAlign: 'center' }}>L</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, i) => (
              <tr key={s.id} onClick={() => openStudent(s)} style={{ borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={S.avatar(i, 26)}>{initials(s.name)}</div>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    {isVIP(s) && <span style={{ fontSize: 10 }}>⭐</span>}
                  </div>
                </td>
                {s.att.map((d, j) => {
                  const [color, bg] = dailyColors[d] || dailyColors['P']
                  return (
                    <td key={j} style={{ padding: 8, textAlign: 'center' }}>
                      <span style={{ background: bg, color, padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{d}</span>
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center', padding: 8, fontWeight: 600 }}>{s.att.filter(d=>d==='P').length}</td>
                <td style={{ textAlign: 'center', padding: 8, color: '#dc2626', fontWeight: 600 }}>{s.att.filter(d=>d==='A').length}</td>
                <td style={{ textAlign: 'center', padding: 8, color: '#d97706', fontWeight: 600 }}>{s.att.filter(d=>d==='L').length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'class' && (
        <div>
          {CLASSES.map(cls => {
            const clsStudents = filteredStudents.filter(s => STUDENT_CLASSES[s.id] === cls.id)
            if (clsStudents.length === 0) return null
            return (
              <div key={cls.id} style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1f36', marginBottom: 8, padding: '6px 10px', background: '#f4f5f7', borderRadius: 6 }}>
                  🏫 {cls.name} — {cls.grade} · {cls.teacher}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e8eaed' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px' }}>Student</th>
                      {DAYS.map(d => <th key={d} style={{ padding: 6, textAlign: 'center' }}>{d}</th>)}
                      <th style={{ padding: 6, textAlign: 'center' }}>Avg %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clsStudents.map((s, i) => {
                      const histData = HISTORICAL_DATA[s.id] || []
                      const avgPct = histData.length > 0 ? Math.round(histData.reduce((acc,d) => acc+d.pct, 0) / histData.length) : null
                      return (
                        <tr key={s.id} onClick={() => openStudent(s, 'tracking')} style={{ borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}>
                          <td style={{ padding: '7px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={S.avatar(i, 24)}>{initials(s.name)}</div>
                              <span style={{ fontWeight: 500 }}>{s.name}</span>
                            </div>
                          </td>
                          {DAYS.map((d, j) => {
                            const dayData = histData.find(h => new Date(h.date).getDay() === j)
                            return (
                              <td key={j} style={{ padding: 6, textAlign: 'center' }}>
                                {dayData ? (
                                  <span style={{ background: dayData.pct >= 70 ? '#dcfce7' : dayData.pct >= 50 ? '#fef3c7' : '#fee2e2', color: dayData.pct >= 70 ? '#166534' : dayData.pct >= 50 ? '#92400e' : '#dc2626', padding: '2px 5px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{dayData.pct}%</span>
                                ) : <span style={{ color: '#d1d5db', fontSize: 10 }}>—</span>}
                              </td>
                            )
                          })}
                          <td style={{ textAlign: 'center', padding: 6 }}>
                            {avgPct !== null ? (
                              <span style={{ fontWeight: 700, fontSize: 12, color: avgPct >= 70 ? '#16a34a' : avgPct >= 50 ? '#d97706' : '#dc2626' }}>{avgPct}%</span>
                            ) : <span style={{ color: '#9ca3af', fontSize: 10 }}>No data</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── ATTENDANCE PAGE ───────────────────────────────────────────────────────────
function AttendancePage({ students, setStudents, role, attFilter, setAttFilter, filteredStudents, openStudent }) {
  const [leavePopup, setLeavePopup] = useState(null)
  const [leaveReason, setLeaveReason] = useState('therapy')
  const [leaveStaffSearch, setLeaveStaffSearch] = useState('')
  const [leaveStaffId, setLeaveStaffId] = useState('')
  const [dailyView, setDailyView] = useState('daily')
  const [collapsed, setCollapsed] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const [latePopup, setLatePopup] = useState(null) // studentId
  const [lateTime, setLateTime] = useState('')
  const [lateReason, setLateReason] = useState('no-reason')
  const [lateNote, setLateNote] = useState('')

  function updateDailyStatus(id, status) {
    const prev = students.find(s => s.id === id)
    setUndoStack(u => [...u.slice(-19), { type: 'single', id, dailyStatus: prev?.dailyStatus || 'present', lateDetails: prev?.lateDetails || null }])
    setStudents(prev => prev.map(s => s.id === id ? { ...s, dailyStatus: status } : s))
    if (status === 'late') {
      setLatePopup(id)
      setLateTime('')
      setLateReason('no-reason')
      setLateNote('')
    }
  }

  function undo() {
    if (undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    if (last.type === 'bulk') {
      setStudents(prev => prev.map(s => {
        const saved = last.snapshot.find(x => x.id === s.id)
        return saved ? { ...s, dailyStatus: saved.dailyStatus, lateDetails: saved.lateDetails } : s
      }))
    } else {
      setStudents(prev => prev.map(s => s.id === last.id ? { ...s, dailyStatus: last.dailyStatus, lateDetails: last.lateDetails } : s))
    }
    setUndoStack(u => u.slice(0, -1))
  }

  function confirmLate() {
    setStudents(prev => prev.map(s => s.id === latePopup ? { ...s, lateDetails: { timeArrived: lateTime, reason: lateReason, note: lateNote } } : s))
    setLatePopup(null)
  }

  const filteredStaff = leaveStaffSearch.length > 0
    ? STAFF.filter(st => st.name.toLowerCase().includes(leaveStaffSearch.toLowerCase()) || st.role.toLowerCase().includes(leaveStaffSearch.toLowerCase()))
    : STAFF

  function handleToggle(s) {
    if (s.status === 'present') {
      // Turning off — show popup to pick reason
      setLeavePopup(s.id)
      setLeaveReason('therapy')
      setLeaveStaffSearch('')
      setLeaveStaffId('')
    } else {
      // Turning on — mark present
      setStudents(prev => prev.map(x => x.id === s.id ? { ...x, status: 'present', withStaff: null } : x))
    }
  }

  function confirmLeave() {
    const statusMap = { therapy: 'therapy', 'with-bt': 'with-bt', menahel: 'present', hallway: 'unknown', other: 'unknown' }
    const newStatus = statusMap[leaveReason] || 'unknown'
    setStudents(prev => prev.map(x => x.id === leavePopup ? { ...x, status: newStatus, withStaff: leaveStaffId || null } : x))
    setLeavePopup(null)
  }

  const leaveStudent = leavePopup ? students.find(s => s.id === leavePopup) : null

  return (
    <div>
      {/* Late Details Popup */}
      {latePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#d97706', padding: '14px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>⏰ {students.find(s=>s.id===latePopup)?.name} — Late Details</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Optional — fill in what you know</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Time Arrived</div>
                <input type="time" value={lateTime} onChange={e => setLateTime(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['no-reason','❓ No reason given'],['parent-called','📞 Parent called ahead'],['sick','🤒 Sick / not feeling well'],['transport','🚌 Transportation issue'],['appointment','🏥 Doctor appointment'],['other','📝 Other']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `2px solid ${lateReason === val ? '#d97706' : '#e5e7eb'}`, cursor: 'pointer', background: lateReason === val ? '#fffbeb' : '#fff' }}>
                      <input type="radio" name="lateReason" value={val} checked={lateReason === val} onChange={() => setLateReason(val)} />
                      <span style={{ fontWeight: lateReason === val ? 700 : 400, fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Note (optional)</div>
                <input value={lateNote} onChange={e => setLateNote(e.target.value)} placeholder="e.g. Father called at 9am, said coming by 10..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLatePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Skip</button>
                <button onClick={confirmLate} style={{ ...S.btn('primary'), flex: 1 }}>Save Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Popup */}
      {leavePopup && leaveStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#1a1f36', padding: '16px 20px', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🚪 {leaveStudent.name} is leaving class</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Select reason for leaving</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['therapy', '🧠 Therapy'],
                    ['with-bt', '👤 With BT'],
                    ['menahel', '🎓 Called to Menahel'],
                    ['hallway', '❓ Location Unknown'],
                    ['other', '📝 Other'],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `2px solid ${leaveReason === val ? '#1a1f36' : '#e5e7eb'}`, cursor: 'pointer', background: leaveReason === val ? '#f4f5f7' : '#fff' }}>
                      <input type="radio" name="reason" value={val} checked={leaveReason === val} onChange={() => setLeaveReason(val)} />
                      <span style={{ fontWeight: leaveReason === val ? 700 : 400, fontSize: 14 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(leaveReason === 'therapy' || leaveReason === 'with-bt') && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>With whom? (start typing)</div>
                  <input
                    value={leaveStaffSearch}
                    onChange={e => { setLeaveStaffSearch(e.target.value); setLeaveStaffId('') }}
                    placeholder="Type staff name..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', marginBottom: 6 }}
                  />
                  {leaveStaffSearch.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      {filteredStaff.slice(0, 5).map(st => (
                        <div key={st.id} onClick={() => { setLeaveStaffId(st.id); setLeaveStaffSearch(st.name) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, background: leaveStaffId === st.id ? '#f4f5f7' : '#fff', borderBottom: '1px solid #f4f5f7' }}>
                          <span style={{ fontWeight: 600 }}>{st.name}</span>
                          <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 11 }}>{st.role}</span>
                        </div>
                      ))}
                      {filteredStaff.length === 0 && <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 13 }}>No staff found</div>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setLeavePopup(null)} style={{ ...S.btn('ghost'), flex: 1 }}>Cancel</button>
                <button onClick={confirmLeave} style={{ ...S.btn('primary'), flex: 1 }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Attendance</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDailyView('daily')} style={{ ...S.btn(dailyView === 'daily' ? 'primary' : 'ghost'), padding: '6px 14px', fontSize: 12 }}>📅 Daily Check-In</button>
          <button onClick={() => setDailyView('class')} style={{ ...S.btn(dailyView === 'class' ? 'primary' : 'ghost'), padding: '6px 14px', fontSize: 12 }}>🏫 Class Toggle</button>
          <button onClick={() => setDailyView('weekly')} style={{ ...S.btn(dailyView === 'weekly' ? 'primary' : 'ghost'), padding: '6px 14px', fontSize: 12 }}>📊 Weekly Record</button>
        </div>
      </div>

      {/* DAILY CHECK-IN */}
      {dailyView === 'daily' && (
        <div style={S.card}>
          {/* Summary on TOP - clickable */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              ['✅ Present', students.filter(s=>(s.dailyStatus||'present')==='present').length, '#16a34a', 'present'],
              ['❌ Absent', students.filter(s=>s.dailyStatus==='absent').length, '#dc2626', 'absent'],
              ['⏰ Late', students.filter(s=>s.dailyStatus==='late').length, '#d97706', 'late'],
              ['🚪 Left Early', students.filter(s=>s.dailyStatus==='left-early').length, '#7c3aed', 'left-early'],
            ].map(([label, val, color, status]) => (
              <div key={label} onClick={() => { const filtered = students.filter(s => (s.dailyStatus||'present') === status); if (filtered.length > 0) { /* drill down */ } }} style={{ textAlign: 'center', background: '#f4f5f7', borderRadius: 8, padding: '12px', cursor: 'pointer', border: `2px solid transparent` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `2px solid ${color}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '2px solid transparent' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>📅 Who came to Yeshiva today?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {undoStack.length > 0 && <button onClick={undo} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>↩️ Undo</button>}
              <button onClick={() => setCollapsed(c => !c)} style={{ ...S.btn('ghost'), padding: '5px 12px', fontSize: 12 }}>{collapsed ? '⬇️ Expand All' : '⬆️ Collapse All'}</button>
              <button onClick={() => { setUndoStack(u => [...u.slice(-9), { type: 'bulk', snapshot: students.map(s => ({ id: s.id, dailyStatus: s.dailyStatus||'present', lateDetails: s.lateDetails||null })) }]); setStudents(prev => prev.map(s => ({ ...s, dailyStatus: 'present', lateDetails: null }))) }} style={{ ...S.btn('success'), padding: '5px 12px', fontSize: 12 }}>✅ All Present</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: collapsed ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
            {students.map((s, i) => {
              const daily = s.dailyStatus || 'present'
              const colors = { present: '#16a34a', absent: '#dc2626', late: '#d97706', 'left-early': '#7c3aed' }
              const labels = { present: '✅ Present', absent: '❌ Absent', late: '⏰ Late', 'left-early': '🚪 Left Early' }
              return (
                <div key={s.id} style={{ background: '#fafafa', border: `1px solid ${daily !== 'present' ? colors[daily]+'40' : '#e8eaed'}`, borderLeft: `4px solid ${colors[daily]}`, borderRadius: 10, padding: collapsed ? '10px 12px' : '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: collapsed ? 0 : 8 }}>
                    <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: colors[daily], fontWeight: 600 }}>{labels[daily]}</div>
                      {daily === 'late' && s.lateDetails?.timeArrived && (
                        <div style={{ fontSize: 10, color: '#6b7280' }}>⏰ {s.lateDetails.timeArrived}{s.lateDetails.note ? ` · ${s.lateDetails.note}` : ''}</div>
                      )}
                    </div>
                  </div>
                  {!collapsed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {[['present','✅ Present'],['absent','❌ Absent'],['late','⏰ Late'],['left-early','🚪 Left Early']].map(([val, label]) => (
                        <button key={val} onClick={() => updateDailyStatus(s.id, val)}
                          style={{ padding: '4px 6px', borderRadius: 5, border: `1px solid ${daily === val ? colors[val] : '#e5e7eb'}`, background: daily === val ? colors[val] + '20' : '#fff', color: daily === val ? colors[val] : '#6b7280', fontSize: 10, fontWeight: daily === val ? 700 : 400, cursor: 'pointer' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
        </div>
      )}

      {/* CLASS TOGGLE */}
      {dailyView === 'class' && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          {/* Summary boxes on top - clickable */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              ['✅ Present', filteredStudents.filter(s=>s.status==='present').length, '#16a34a'],
              ['❌ Absent', filteredStudents.filter(s=>s.status==='absent').length, '#dc2626'],
              ['⏰ Late', filteredStudents.filter(s=>s.status==='late').length, '#d97706'],
              ['🧠 Therapy', filteredStudents.filter(s=>s.status==='therapy').length, '#7c3aed'],
              ['👤 With BT', filteredStudents.filter(s=>s.status==='with-bt').length, '#0891b2'],
              ['❓ Unknown', filteredStudents.filter(s=>s.status==='unknown').length, '#dc2626'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center', background: '#f4f5f7', borderRadius: 8, padding: '10px 6px', border: `1px solid ${(val as number) > 0 ? color+'30' : '#e8eaed'}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: (val as number) > 0 ? color : '#9ca3af' }}>{val}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>🔄 Live Class Toggle</div>
            <button onClick={() => setStudents(prev => prev.map(s => ({ ...s, status: 'present', withStaff: null })))} style={{ ...S.btn('success'), padding: '5px 12px', fontSize: 12 }}>✅ All Present</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {filteredStudents.map((s, i) => {
            const inClass = s.status === 'present'
            const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
            return (
              <div key={s.id} style={{ background: inClass ? '#f0fdf4' : s.status === 'unknown' ? '#fef2f2' : '#fafafa', border: `2px solid ${inClass ? '#86efac' : s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={S.avatar(i, 30)}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {withStaffObj && <div style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</div>}
                    {!inClass && !withStaffObj && <div style={{ fontSize: 10, color: statusColor[s.status], fontWeight: 600 }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: inClass ? '#166534' : '#dc2626', fontWeight: 600 }}>{inClass ? 'In Class' : 'Left Class'}</span>
                  <div onClick={() => role !== 'therapist' && handleToggle(s)} style={{ width: 44, height: 24, borderRadius: 12, background: inClass ? '#16a34a' : '#e5e7eb', position: 'relative', cursor: role !== 'therapist' ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: inClass ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}

      {/* WEEKLY RECORD */}
      {dailyView === 'weekly' && (
      <div style={S.card}>
        <WeeklyRecord students={students} filteredStudents={filteredStudents} openStudent={openStudent} />
      </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('admin')
  const [userName, setUserName] = useState('')
  const [page, setPage] = useState('dashboard')
  const [students, setStudents] = useState(initialStudents)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentTab, setSelectedStudentTab] = useState('overview')
  const [storeStudent, setStoreStudent] = useState(null)
  const [behaviorStudent, setBehaviorStudent] = useState(null)
  const [behaviorTab, setBehaviorTab] = useState('positive')
  const [attFilter, setAttFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [teachingMode, setTeachingMode] = useState(false)
  const [teacherClass, setTeacherClass] = useState(null)
  const [drillDown, setDrillDown] = useState(null)
  const [intakeList, setIntakeList] = useState([
    { id: 1, name: 'Moshe Friedman', dob: '2012-03-15', currentSchool: 'Yeshiva Ohr Torah', shul: 'Khal Avreichim', heardAbout: 'Rabbi Klein', fatherName: 'Avraham Friedman', fatherPhone: '718-555-1234', motherName: 'Rivka', motherMaiden: 'Schwartz', motherPhone: '718-555-1235', address: '1234 56th St Brooklyn NY', status: 'interviewed', diagnoses: ['ADHD', 'Anxiety'], issues: 'Difficulty focusing in large groups. Responds well 1-on-1.', interviewNotes: 'Very bright boy. Strong in Gemara. Needs structured environment.', scores: { math: 3, reading: 4, comprehension: 3, social: 2, behavior: 3 }, documents: [{ name: 'Assessment_Friedman.pdf', date: '2025-11-10' }] },
    { id: 2, name: 'Yosef Stern', dob: '2011-07-22', currentSchool: 'Mesivta Beis Shraga', shul: 'Young Israel', heardAbout: 'Parent referral', fatherName: 'Shmuel Stern', fatherPhone: '718-555-5678', motherName: 'Chana', motherMaiden: 'Goldberg', motherPhone: '718-555-5679', address: '567 Ave J Brooklyn NY', status: 'applicant', diagnoses: [], issues: '', interviewNotes: '', scores: { math: 0, reading: 0, comprehension: 0, social: 0, behavior: 0 }, documents: [] },
    { id: 3, name: 'Dovid Katz', dob: '2012-11-05', currentSchool: 'Talmud Torah Ohel Moshe', shul: 'Bobov', heardAbout: 'Website', fatherName: 'Pinchas Katz', fatherPhone: '718-555-9012', motherName: 'Sara', motherMaiden: 'Weiss', motherPhone: '718-555-9013', address: '890 48th St Brooklyn NY', status: 'accepted', diagnoses: ['Dyslexia'], issues: 'Reading difficulties. Math strong.', interviewNotes: 'Warm personality. Will fit well socially.', scores: { math: 4, reading: 2, comprehension: 2, social: 4, behavior: 4 }, documents: [{ name: 'Psych_Eval_Katz.pdf', date: '2025-10-15' }, { name: 'IEP_Katz.pdf', date: '2025-10-15' }] },
  ])
  const [selectedIntake, setSelectedIntake] = useState(null)
  const [intakeTab, setIntakeTab] = useState('info')
  const [intakeSection, setIntakeSection] = useState('pre') // 'pre' or 'applicants'
  const [preIntakeList, setPreIntakeList] = useState([
    { id: 1, name: 'Menachem Goldstein', phone: '718-555-1001', program: 'mesivta', status: 'call-back', callNotes: 'Mother called, very interested. Son is currently in Oholei Torah.', tourDate: '', tourTime: '', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 2, name: 'Yaakov Rosenberg', phone: '718-555-1002', program: 'mesivta', status: 'call-back', callNotes: 'Father left message, needs callback.', tourDate: '', tourTime: '', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 3, name: 'Avrohom Stein', phone: '718-555-1003', program: 'mesivta', status: 'tour-scheduled', callNotes: 'Very motivated family. Boy has ADHD, doing well with support.', tourDate: '2026-06-10', tourTime: '10:00', interviewDate: '', interviewTime: '', followUpNotes: 'Remind day before' },
    { id: 4, name: 'Boruch Friedman', phone: '718-555-1004', program: 'mesivta', status: 'tour-scheduled', callNotes: 'Rabbi Klein referred them.', tourDate: '2026-06-10', tourTime: '11:30', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 5, name: 'Shmuel Weiss', phone: '718-555-1005', program: 'mesivta', status: 'interview-scheduled', callNotes: 'Came for tour last week, very impressed.', tourDate: '2026-06-03', tourTime: '10:00', interviewDate: '2026-06-12', interviewTime: '09:00', followUpNotes: 'Send reminders' },
    { id: 6, name: 'Pinchas Kohn', phone: '718-555-1006', program: 'mesivta', status: 'interview-scheduled', callNotes: 'Family from Monsey, willing to relocate.', tourDate: '2026-06-04', tourTime: '14:00', interviewDate: '2026-06-13', interviewTime: '10:00', followUpNotes: '' },
    { id: 7, name: 'Dovid Levi', phone: '718-555-1007', program: 'mesivta', status: 'needs-interview-time', callNotes: 'Tour done. Ready to schedule interview.', tourDate: '2026-06-05', tourTime: '10:00', interviewDate: '', interviewTime: '', followUpNotes: 'Call to set interview time' },
    { id: 8, name: 'Nochum Klein', phone: '718-555-1008', program: 'yeshiva-ketana', status: 'call-back', callNotes: 'Parent called about 7th grade placement.', tourDate: '', tourTime: '', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 9, name: 'Yitzchok Blum', phone: '718-555-1009', program: 'yeshiva-ketana', status: 'call-back', callNotes: 'Inquiry from website.', tourDate: '', tourTime: '', interviewDate: '', interviewTime: '', followUpNotes: '' },
    { id: 10, name: 'Moshe Berger', phone: '718-555-1010', program: 'yeshiva-ketana', status: 'tour-scheduled', callNotes: 'Looking for 8th grade.', tourDate: '2026-06-11', tourTime: '09:30', interviewDate: '', interviewTime: '', followUpNotes: '' },
  ])
  const [selectedPreIntake, setSelectedPreIntake] = useState(null)
  const [todos, setTodos] = useState([
    { id: 1, date: '2025-06-10', time: '10:20 AM', text: 'Tour for Friedman family', category: 'meeting', done: false },
    { id: 2, date: '2025-06-10', time: '12:30 PM', text: 'Interview with Moshe Braver', category: 'meeting', done: false },
    { id: 3, date: '2025-06-10', time: '', text: 'Announce: bus will leave 5 min earlier starting tomorrow morning', category: 'announcement', done: false },
    { id: 4, date: '2025-06-10', time: '', text: 'Conversation with Zevi about changing levels', category: 'general', done: false },
    { id: 5, date: '2025-06-10', time: '', text: "Call Moshe Chaim's parents — plan for him to come on time", category: 'call', done: false },
    { id: 6, date: '2025-06-10', time: '', text: 'IEP meeting coming up soon — make appointment', category: 'appointment', done: false },
    { id: 7, date: '2025-06-10', time: '', text: 'Schedule meeting with Rabbi Ambush — topic: general', category: 'meeting', done: false },
    { id: 8, date: '2025-06-10', time: '', text: 'Make appointment by Rav for 10th grade farher', category: 'appointment', done: false },
  ])
  const [newTodo, setNewTodo] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('general')
  const [newTodoTime, setNewTodoTime] = useState('')

  function handleLogin(r, name) { 
    setRole(r)
    setUserName(name)
    setLoggedIn(true)
    setPage('dashboard')
    if (r === 'teacher') {
      const cls = TEACHER_CLASS_MAP[name] || null
      setTeacherClass(cls)
    }
  }
  function openStudent(s, tab = 'overview') { setSelectedStudent(s); setSelectedStudentTab(tab) }
  function updateStatus(id, status) { setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s)) }
  function addPoints(id, amount) { playSound(amount > 0 ? 'positive' : 'negative'); setStudents(prev => prev.map(s => s.id === id ? { ...s, points: Math.max(0, s.points + amount) } : s)) }
  function addReminder(id) { const s = students.find(x => x.id === id); playSound(s && s.reminders + 1 >= 6 ? 'redmark' : 'negative'); setStudents(prev => prev.map(s => s.id === id ? { ...s, reminders: s.reminders + 1 } : s)) }
  function applyBehavior(studentId, beh) {
    playSound(beh.points > 0 ? 'positive' : 'negative')
    setStudents(prev => prev.map(s => s.id !== studentId ? s : { ...s, points: Math.max(0, s.points + beh.points), reminders: beh.points < 0 ? s.reminders + 1 : s.reminders, behaviorLog: [{ label: beh.label, points: beh.points, date: new Date().toISOString().slice(0,10) }, ...s.behaviorLog].slice(0, 20) }))
  }
  function buyItem(studentId, cost, itemName) {
    const s = students.find(x => x.id === studentId)
    if (!s || s.points < cost) { alert('Not enough points!'); return }
    playSound('store'); setStudents(prev => prev.map(x => x.id === studentId ? { ...x, points: x.points - cost } : x)); alert(`${s.name} redeemed: ${itemName}!`)
  }

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />
  if (teachingMode) return <TeachingMode students={students} setStudents={setStudents} onExit={() => setTeachingMode(false)} isAdmin={role === 'admin'} />

  const present = students.filter(s => s.status === 'present').length
  const absent = students.filter(s => s.status === 'absent').length
  const late = students.filter(s => s.status === 'late').length
  const inTherapy = students.filter(s => s.status === 'therapy').length
  const withBT = students.filter(s => s.status === 'with-bt').length
  const unknown = students.filter(s => s.status === 'unknown').length
  const notArrived = students.filter(s => s.status === 'not-arrived').length
  const total = students.length
  const improved = students.filter(s => s.reminders < s.lastWeekReminders).length
  const needsAttention = students.filter(s => s.reminders > s.lastWeekReminders).length
  const vipStudents = students.filter(s => isVIP(s))
  const urgentStudents = students.filter(s => s.reminders >= 6 || s.detention || s.att.filter(d=>d==='A').length >= 3 || s.status === 'unknown')
  const callsDueStudents = students.filter(s => { const lc = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length-1] : null; return !lc || daysSince(lc.date) > 14 })

  const alerts = students.flatMap(s => {
    const a = []; const absCount = s.att.filter(d => d === 'A').length; const lateCount = s.att.filter(d => d === 'L').length
    const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
    if (s.status === 'unknown') a.push({ student: s.name, id: s.id, msg: '❓ Location unknown — please locate immediately!', type: 'danger' })
    if (s.detention) a.push({ student: s.name, id: s.id, msg: 'Has active detention', type: 'danger' })
    if (s.reminders >= 6) a.push({ student: s.name, id: s.id, msg: '6 reminders — consequence required!', type: 'danger' })
    if (s.reminders >= 4 && s.reminders < 6) a.push({ student: s.name, id: s.id, msg: `${s.reminders} reminders this week`, type: 'warn' })
    if (absCount >= 2) a.push({ student: s.name, id: s.id, msg: `Absent ${absCount} days this week`, type: absCount >= 3 ? 'danger' : 'warn' })
    if (lateCount >= 3) a.push({ student: s.name, id: s.id, msg: `Late ${lateCount} days`, type: 'warn' })
    if (!lastCall || daysSince(lastCall.date) > 14) a.push({ student: s.name, id: s.id, msg: lastCall ? `No parent call in ${daysSince(lastCall.date)} days` : 'Parent never called', type: 'info' })
    return a
  }).sort((a, b) => {
    const order = { danger: 0, warn: 1, info: 2 }
    return order[a.type] - order[b.type]
  })

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'students', label: 'All Students', icon: '👥' },
    { id: 'intake', label: 'Intake / Admissions', icon: '📋' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
    { id: 'calls', label: 'Parent Calls', icon: '📞' },
    { id: 'todo', label: 'To-Do List', icon: '📋' },
  ]
  const teacherNav = [
    { id: 'dashboard', label: 'My Class', icon: '🏫' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'behavior', label: 'Behavior & Points', icon: '⭐' },
    { id: 'store', label: 'Token Store', icon: '🛍' },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: '🔔' },
  ]
  const therapistNav = [
    { id: 'dashboard', label: 'My Students', icon: '🧠' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'students', label: 'All Students', icon: '👥' },
  ]

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : therapistNav
  const searchedStudents = search ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : students
  const filteredStudents = attFilter === 'all' ? searchedStudents : searchedStudents.filter(s => s.status === attFilter)

  function ClickCard({ label, val, color, sub, filterStudents, goToPage = null }) {
    return (
      <div onClick={() => { if (goToPage) setPage(goToPage); else if (filterStudents) setDrillDown({ title: label, students: filterStudents }) }}
        style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #e8eaed', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: (filterStudents || goToPage) ? 'pointer' : 'default', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { if (filterStudents || goToPage) { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
          {(filterStudents || goToPage) && <span style={{ fontSize: 10, color: '#9ca3af' }}>click →</span>}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{sub}</div>
      </div>
    )
  }

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Hadran Academy</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{role === 'admin' ? 'Menahel Portal' : role === 'teacher' ? 'Teacher Portal' : 'Therapist Portal'}</div>
        </div>
        <div style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map(item => (
            <div key={item.id} style={S.sidebarItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'alerts' && alerts.filter(a => a.type === 'danger').length > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              )}
            </div>
          ))}
          {role !== 'therapist' && (
            <div onClick={() => setTeachingMode(true)} style={{ ...S.sidebarItem(false), background: 'rgba(255,255,255,0.08)', margin: '8px 8px 2px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span>{role === 'admin' ? '🎓' : '🏫'}</span><span>{role === 'admin' ? 'School-Wide Mode' : 'Teaching Mode'}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{userName}</div>
          <button onClick={() => setLoggedIn(false)} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Logout</button>
        </div>
      </div>

      <div style={S.main}>
        <div style={{ maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search students..." style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e8eaed', fontSize: 13, width: 260, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
            {search && (
              <div style={{ position: 'absolute', top: '100%', left: 0, width: 300, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                {searchedStudents.slice(0,6).map((s,i) => (
                  <div key={s.id} onClick={() => { openStudent(s); setSearch('') }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f4f5f7', display: 'flex', alignItems: 'center', gap: 10 }}
                    onMouseEnter={e => e.currentTarget.style.background='#f4f5f7'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: statusColor[s.status] }}>{statusEmoji[s.status]} {statusLabel[s.status]}</div>
                    </div>
                  </div>
                ))}
                {searchedStudents.length === 0 && <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No students found</div>}
                <div onClick={() => setSearch('')} style={{ padding: '8px 14px', fontSize: 11, color: '#9ca3af', cursor: 'pointer', textAlign: 'center', borderTop: '1px solid #f4f5f7' }}>✕ Close</div>
              </div>
            )}
          </div>
        </div>

        {page === 'dashboard' && role === 'teacher' && <TeacherDashboard students={students} setStudents={setStudents} userName={userName} setSelectedStudent={s => openStudent(s)} setTeachingMode={setTeachingMode} initialClass={teacherClass} setDrillDown={setDrillDown} />}
        {page === 'dashboard' && role === 'therapist' && <TherapistDashboard students={students} userName={userName} setSelectedStudent={s => openStudent(s, 'therapy')} />}

        {page === 'dashboard' && role === 'admin' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{getGreeting(new Date().getHours())}, {userName} 👋</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}><LiveClock /> · Dargei Beis · {total} students</p>
            </div>
            {unknown > 0 && (
              <div style={{ background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 10, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 900, color: '#dc2626', fontSize: 20 }}>❓ {unknown} student{unknown > 1 ? 's' : ''} with unknown location! </span>
                  <span style={{ fontSize: 15, color: '#dc2626', fontWeight: 600 }}>Please locate immediately</span>
                </div>
                <button onClick={() => setDrillDown({ title: '❓ Location Unknown', students: students.filter(s=>s.status==='unknown') })} style={{ ...S.btn('danger'), padding: '6px 18px', fontSize: 13, flexShrink: 0 }}>View</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
              <ClickCard label="Total" val={total} color="#1a1f36" sub="enrolled" filterStudents={students} />
              <ClickCard label="Present" val={present} color="#2563eb" sub={`${Math.round(present/total*100)}%`} filterStudents={students.filter(s=>s.status==='present')} />
              <ClickCard label="Absent" val={absent} color="#dc2626" sub="not in school" filterStudents={students.filter(s=>s.status==='absent')} />
              <ClickCard label="⭐ VIP" val={vipStudents.length} color="#854d0e" sub="perfect week" filterStudents={vipStudents} />
              <ClickCard label="Urgent" val={urgentStudents.length} color="#dc2626" sub="require action" goToPage="alerts" />
              <ClickCard label="Calls Due" val={callsDueStudents.length} color="#d97706" sub="not called" goToPage="calls" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Late Today', val: late, color: '#d97706', icon: '⏰', filter: students.filter(s=>s.status==='late') },
                { label: 'In Therapy', val: inTherapy, color: '#7c3aed', icon: '🧠', filter: students.filter(s=>s.status==='therapy') },
                { label: 'With BT', val: withBT, color: '#0891b2', icon: '👤', filter: students.filter(s=>s.status==='with-bt') },
                { label: '❓ Unknown', val: unknown, color: '#dc2626', icon: '❓', filter: students.filter(s=>s.status==='unknown') },
              ].map(stat => (
                <div key={stat.label} onClick={() => stat.filter.length > 0 && setDrillDown({ title: stat.label, students: stat.filter })}
                  style={{ background: stat.label === '❓ Unknown' && unknown > 0 ? '#fef2f2' : '#fff', borderRadius: 10, padding: '14px 18px', border: `1px solid ${stat.label === '❓ Unknown' && unknown > 0 ? '#fecaca' : '#e8eaed'}`, display: 'flex', alignItems: 'center', gap: 14, cursor: stat.filter.length > 0 ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { if (stat.filter.length > 0) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: 28 }}>{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</div>
                  </div>
                  {stat.filter.length > 0 && <span style={{ fontSize: 10, color: '#9ca3af' }}>→</span>}
                </div>
              ))}
            </div>

            {/* Class summary for admin */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {CLASSES.map(cls => {
                const clsStudents = students.filter(s => STUDENT_CLASSES[s.id] === cls.id)
                const clsPresent = clsStudents.filter(s => s.status === 'present').length
                const clsAbsent = clsStudents.filter(s => s.status === 'absent').length
                const clsOut = clsStudents.filter(s => s.status !== 'present' && s.status !== 'absent').length
                return (
                  <div key={cls.id} onClick={() => setDrillDown({ title: `🏫 ${cls.name} — All Students`, students: clsStudents })} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid #e8eaed', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a1f36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{cls.id.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{cls.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{cls.grade}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `✅ ${cls.name} — Present`, students: clsStudents.filter(s=>s.status==='present') }) }} style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: 6, padding: '6px', cursor: 'pointer' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{clsPresent}</div>
                        <div style={{ fontSize: 10, color: '#16a34a' }}>present</div>
                      </div>
                      <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `❌ ${cls.name} — Absent`, students: clsStudents.filter(s=>s.status==='absent') }) }} style={{ textAlign: 'center', background: '#fef2f2', borderRadius: 6, padding: '6px', cursor: 'pointer' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{clsAbsent}</div>
                        <div style={{ fontSize: 10, color: '#dc2626' }}>absent</div>
                      </div>
                      <div onClick={e => { e.stopPropagation(); setDrillDown({ title: `🚶 ${cls.name} — Out`, students: clsStudents.filter(s=>s.status!=='present'&&s.status!=='absent') }) }} style={{ textAlign: 'center', background: '#fffbeb', borderRadius: 6, padding: '6px', cursor: 'pointer' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{clsOut}</div>
                        <div style={{ fontSize: 10, color: '#d97706' }}>out</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 16 }}>
              {/* Column 1: To-Do */}
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>📋 Today's To-Do</div>
                  <button onClick={() => setPage('todo')} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflow: 'auto' }}>
                  {todos.filter(t => !t.done).map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8eaed' }}>
                      <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: true } : t))} style={{ marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{todo.text}</div>
                        {todo.time && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>🕐 {todo.time}</div>}
                      </div>
                    </div>
                  ))}
                  {todos.filter(t => !t.done).length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '1rem' }}>All done! ✅</div>}
                </div>
                <div style={{ marginTop: 10 }}>
                  <input placeholder="Quick add task... (press Enter)" onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: '', text: e.currentTarget.value.trim(), category: 'general', done: false }]); e.currentTarget.value = '' } }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Column 2: Weekly Improvement */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📈 Weekly Improvement</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div onClick={() => setDrillDown({ title: '📈 Improved', students: students.filter(s=>s.reminders<s.lastWeekReminders) })} style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{improved}</div>
                    <div style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>📈 Improved</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '📉 Needs Attention', students: students.filter(s=>s.reminders>s.lastWeekReminders) })} style={{ background: '#fef2f2', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{needsAttention}</div>
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>📉 Attention</div>
                  </div>
                  <div onClick={() => setDrillDown({ title: '⭐ VIP', students: vipStudents })} style={{ background: '#fefce8', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer', border: '1px solid #ca8a04' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#854d0e' }}>{vipStudents.length}</div>
                    <div style={{ fontSize: 10, color: '#854d0e', fontWeight: 600 }}>⭐ VIP</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflow: 'auto' }}>
                  {students.filter(s => s.reminders >= 4 || s.reminders > s.lastWeekReminders).slice(0, 5).map((s, i) => {
                    const imp = getImprovement(s)
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, cursor: 'pointer' }}>
                        <div style={S.avatar(i, 26)}>{initials(s.name)}</div>
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: imp.color }}>{imp.icon}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Column 3: Urgent Alerts + Calls stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...S.card, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔔 Urgent Alerts</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflow: 'auto' }}>
                    {alerts.filter(a => a.type === 'danger').slice(0, 4).map((a, i) => (
                      <div key={i} onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{a.student}</div>
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>{a.msg}</div>
                      </div>
                    ))}
                    {alerts.filter(a => a.type === 'danger').length === 0 && <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '0.5rem' }}>No urgent alerts ✅</div>}
                  </div>
                </div>
                <div style={{ ...S.card, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📞 Calls Needed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflow: 'auto' }}>
                    {callsDueStudents.slice(0, 5).map((s, i) => {
                      const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                      const days = lastCall ? daysSince(lastCall.date) : 999
                      return (
                        <div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '7px 10px', cursor: 'pointer' }}>
                          <div style={S.avatar(i, 24)}>{initials(s.name)}</div>
                          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 11 }}>{s.name}</div><div style={{ fontSize: 10, color: '#92400e' }}>{lastCall ? `${days}d ago` : 'Never'}</div></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'students' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>All Students</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchedStudents.map((s, i) => {
                const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null
                const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                const imp = getImprovement(s)
                const vip = isVIP(s)
                return (
                  <div key={s.id} onClick={() => openStudent(s)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 18px', borderLeft: vip ? '4px solid #ca8a04' : s.status === 'unknown' ? '4px solid #dc2626' : '1px solid #e8eaed' }}>
                    <div style={S.avatar(i, 40)}>{initials(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.name}
                        {vip && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>⭐ VIP</span>}
                        {s.status === 'unknown' && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>❓ Unknown</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag(statusColor[s.status])}>{statusEmoji[s.status]} {statusLabel[s.status]}</span>
                        {withStaffObj && <span style={{ fontSize: 11, color: '#0891b2', fontWeight: 600 }}>👤 {withStaffObj.name}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, color: imp.color }}>{imp.icon} {imp.label}</span>
                        {s.iep && <span style={S.tag('#5b21b6')}>IEP</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: '#d97706' }}>{s.points}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>pts</div></div>
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: s.reminders >= 4 ? '#dc2626' : '#374151' }}>{s.reminders}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>remind.</div></div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{s.att.filter(d=>d==='P').length}/6</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>days</div>
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 2 }}>
                          <div style={{ width: `${Math.round(s.att.filter(d=>d==='P').length/6*100)}%`, height: '100%', background: s.att.filter(d=>d==='P').length >= 5 ? '#16a34a' : s.att.filter(d=>d==='P').length >= 3 ? '#d97706' : '#dc2626', borderRadius: 2 }} />
                        </div>
                      </div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lastCall ? `${daysSince(lastCall.date)}d` : 'Never'}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>last call</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {page === 'attendance' && (
          <AttendancePage students={students} setStudents={setStudents} role={role} attFilter={attFilter} setAttFilter={setAttFilter} filteredStudents={filteredStudents} openStudent={openStudent} />
        )}

        {page === 'schedule' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>🗓️ Schedule</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Daily Schedule — Dargei Beis</div>
                {SCHEDULE_PERIODS.map((period, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: period.type === 'break' ? '#f9fafb' : '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8, opacity: period.type === 'break' ? 0.7 : 1 }}>
                    {period.type === 'class' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1a1f36', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{period.id}</div>}
                    {period.type === 'break' && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>—</div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{period.subject}</div>
                      {period.teachers.length > 0 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{period.teachers.join(' · ')}</div>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: period.type === 'break' ? '#9ca3af' : '#1a1f36' }}>{period.time}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧠 Therapy Pullouts This Week</div>
                  {THERAPY_SCHEDULE.map((t, i) => {
                    const staffMember = STAFF.find(st => st.id === t.staffId)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #e8eaed', marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#5b21b6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.day}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{t.student}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{staffMember?.name} · {t.type}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 700 }}>{t.time}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{t.duration}</div></div>
                      </div>
                    )
                  })}
                </div>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📍 Not In Class Now</div>
                  {students.filter(s => s.status !== 'present').map((s, i) => {
                    const withStaffObj = s.withStaff ? STAFF.find(st => st.id === s.withStaff) : null
                    return (
                      <div key={s.id} onClick={() => openStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: s.status === 'unknown' ? '#fef2f2' : '#fafafa', borderRadius: 6, cursor: 'pointer', border: `1px solid ${s.status === 'unknown' ? '#fecaca' : '#e8eaed'}`, marginBottom: 6 }}>
                        <div style={S.avatar(i, 28)}>{initials(s.name)}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div><div style={{ fontSize: 11, color: statusColor[s.status] }}>{statusEmoji[s.status]} {statusLabel[s.status]}{withStaffObj ? ` · ${withStaffObj.name}` : ''}</div></div>
                      </div>
                    )
                  })}
                  {students.filter(s => s.status !== 'present').length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>All present ✅</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'behavior' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Behavior & Points</h1>
            {behaviorStudent ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <button onClick={() => setBehaviorStudent(null)} style={S.btn('ghost')}>← Back</button>
                  <div style={S.avatar(behaviorStudent.id - 1, 38)}>{initials(behaviorStudent.name)}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{behaviorStudent.name}</div><div style={{ color: '#d97706', fontWeight: 700, fontSize: 13 }}>{students.find(s => s.id === behaviorStudent.id)?.points} pts · {students.find(s => s.id === behaviorStudent.id)?.reminders} reminders</div></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <button onClick={() => setBehaviorTab('positive')} style={S.btn(behaviorTab === 'positive' ? 'success' : 'ghost')}>✅ Positive</button>
                  <button onClick={() => setBehaviorTab('negative')} style={S.btn(behaviorTab === 'negative' ? 'danger' : 'ghost')}>⚠️ Reminders</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(behaviorTab === 'positive' ? BEHAVIORS_POSITIVE : BEHAVIORS_NEGATIVE).map(beh => (
                    <button key={beh.id} onClick={() => applyBehavior(behaviorStudent.id, beh)} style={{ background: behaviorTab === 'positive' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${behaviorTab === 'positive' ? '#86efac' : '#fca5a5'}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{beh.label}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: behaviorTab === 'positive' ? '#166534' : '#dc2626' }}>{beh.points > 0 ? '+' : ''}{beh.points}</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={() => addPoints(behaviorStudent.id, 10)} style={S.btn('success')}>+10 Points</button>
                  <button onClick={() => addPoints(behaviorStudent.id, -10)} style={S.btn('danger')}>-10 Points</button>
                  <button onClick={() => addReminder(behaviorStudent.id)} style={{ ...S.btn('danger'), background: '#7f1d1d' }}>⚠️ Reminder</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[...searchedStudents].sort((a, b) => b.points - a.points).map((s, i) => {
                  const vip = isVIP(s)
                  return (
                    <div key={s.id} onClick={() => setBehaviorStudent(s)} style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderLeft: vip ? '3px solid #ca8a04' : undefined }}>
                      <div style={S.avatar(s.id - 1, 36)}>{initials(s.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>{s.name}{vip && <span style={{ fontSize: 11 }}>⭐</span>}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={S.badge('#92400e', '#fef3c7')}>{s.points} pts</span>
                          {s.reminders > 0 && <span style={S.badge('#dc2626', '#fee2e2')}>⚠️ {s.reminders}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {page === 'store' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>🛍 Token Store</h1>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 18 }}>⭐ VIP items available only to students with a perfect week</p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select a student</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {students.map(s => {
                  const vip = isVIP(s)
                  return (
                    <button key={s.id} onClick={() => setStoreStudent(s.id)} style={{ padding: '6px 12px', borderRadius: 6, border: `2px solid ${storeStudent === s.id ? '#1a1f36' : vip ? '#ca8a04' : '#e5e7eb'}`, cursor: 'pointer', fontSize: 12, fontWeight: storeStudent === s.id ? 700 : 400, background: storeStudent === s.id ? '#1a1f36' : vip ? '#fefce8' : '#fff', color: storeStudent === s.id ? '#fff' : '#374151' }}>
                      {vip && '⭐ '}{s.name} · {s.points} pts
                    </button>
                  )
                })}
              </div>
            </div>
            {storeStudent && (() => {
              const s = students.find(x => x.id === storeStudent)
              const vip = s && isVIP(s)
              return (
                <div>
                  {vip && <div style={{ background: '#fefce8', border: '2px solid #ca8a04', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 24 }}>⭐</span><div><div style={{ fontWeight: 700, color: '#854d0e' }}>VIP Student — All items unlocked!</div></div></div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {STORE_ITEMS.map(item => {
                      const canAfford = s && s.points >= item.cost
                      const canAccess = !item.vip || vip
                      return (
                        <div key={item.id} style={{ ...S.card, textAlign: 'center', opacity: canAccess ? (canAfford ? 1 : 0.5) : 0.3, position: 'relative' }}>
                          {item.vip && <div style={{ position: 'absolute', top: 8, right: 8, background: '#ca8a04', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>VIP</div>}
                          <div style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ color: '#d97706', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>{item.cost} pts</div>
                          <button onClick={() => canAccess ? buyItem(storeStudent, item.cost, item.name) : alert('VIP only!')} style={{ ...S.btn(canAccess && canAfford ? 'success' : 'ghost'), width: '100%', cursor: 'pointer', fontSize: 12 }}>
                            {!canAccess ? '🔒 VIP Only' : canAfford ? 'Redeem' : 'Not enough'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {page === 'alerts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>All Alerts ({alerts.length})</h1>
              <input
                placeholder="🔍 Search by name or type (detention, absent...)"
                id="alertSearch"
                onChange={e => {
                  const v = e.target.value.toLowerCase()
                  document.querySelectorAll('.alert-row').forEach((el: any) => {
                    el.style.display = !v || el.dataset.search?.includes(v) ? '' : 'none'
                  })
                }}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e8eaed', fontSize: 13, width: 320, background: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>No alerts ✅</div>}
              {alerts.map((a, i) => (
                <div key={i} className="alert-row" data-search={`${a.student.toLowerCase()} ${a.msg.toLowerCase()}`}
                  onClick={() => { const s = students.find(x => x.id === a.id); if (s) openStudent(s, 'behavior') }}
                  style={{ background: a.type === 'danger' ? '#fef2f2' : a.type === 'warn' ? '#fffbeb' : '#eff6ff', border: `1px solid ${a.type === 'danger' ? '#fecaca' : a.type === 'warn' ? '#fde68a' : '#bfdbfe'}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.student}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{a.msg}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>View →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'calls' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Parent Call Log</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {students.map((s, i) => { const lastCall = s.parentCalls.length > 0 ? s.parentCalls[s.parentCalls.length - 1] : null; const days = lastCall ? daysSince(lastCall.date) : 999; return (<div key={s.id} onClick={() => openStudent(s, 'calls')} style={{ ...S.card, cursor: 'pointer', borderLeft: `3px solid ${days > 14 ? '#f97316' : '#16a34a'}`, padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><div style={S.avatar(i, 32)}>{initials(s.name)}</div><div><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: days > 14 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>{lastCall ? `Last call: ${days} days ago` : '⚠️ Never called'}</div></div><div style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{s.parentCalls.length} calls</div></div>{lastCall && <div style={{ fontSize: 12, color: '#6b7280', background: '#f4f5f7', borderRadius: 6, padding: '6px 10px' }}>{lastCall.notes}</div>}</div>) })}
            </div>
          </div>
        )}

        {page === 'intake' && role === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📋 Intake / Admissions</h1>
              {intakeSection === 'applicants' && !selectedIntake && (
                <button onClick={() => {
                  const newApp = { id: Date.now(), name: 'New Applicant', dob: '', currentSchool: '', shul: '', heardAbout: '', fatherName: '', fatherPhone: '', motherName: '', motherMaiden: '', motherPhone: '', address: '', status: 'applicant', diagnoses: [], issues: '', interviewNotes: '', scores: { math: 0, reading: 0, comprehension: 0, social: 0, behavior: 0 }, documents: [] }
                  setIntakeList(prev => [...prev, newApp])
                  setSelectedIntake(newApp)
                  setIntakeTab('info')
                }} style={S.btn('primary')}>+ New Applicant</button>
              )}
              {intakeSection === 'pre' && !selectedPreIntake && (
                <button onClick={() => {
                  const newLead = { id: Date.now(), name: '', phone: '', program: 'mesivta', status: 'call-back', callNotes: '', tourDate: '', tourTime: '', interviewDate: '', interviewTime: '', followUpNotes: '' }
                  setPreIntakeList(prev => [...prev, newLead])
                  setSelectedPreIntake(newLead)
                }} style={S.btn('primary')}>+ New Lead</button>
              )}
            </div>

            {/* Section tabs */}
            {!selectedIntake && !selectedPreIntake && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setIntakeSection('pre')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'pre' ? '#1a1f36' : '#e5e7eb'}`, background: intakeSection === 'pre' ? '#1a1f36' : '#fff', color: intakeSection === 'pre' ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📞 Pre-Intake Leads
                  <span style={{ marginLeft: 8, background: intakeSection === 'pre' ? 'rgba(255,255,255,0.2)' : '#f4f5f7', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{preIntakeList.length}</span>
                </button>
                <button onClick={() => setIntakeSection('applicants')} style={{ padding: '10px 20px', borderRadius: 8, border: `2px solid ${intakeSection === 'applicants' ? '#1a1f36' : '#e5e7eb'}`, background: intakeSection === 'applicants' ? '#1a1f36' : '#fff', color: intakeSection === 'applicants' ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📋 Applicants & Interviews
                  <span style={{ marginLeft: 8, background: intakeSection === 'applicants' ? 'rgba(255,255,255,0.2)' : '#f4f5f7', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>{intakeList.length}</span>
                </button>
              </div>
            )}

            {/* PRE-INTAKE SECTION */}
            {intakeSection === 'pre' && !selectedPreIntake && (
              <div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                  {[
                    ['📞 Call Back', preIntakeList.filter(x=>x.status==='call-back').length, '#dc2626'],
                    ['🏫 Tour Scheduled', preIntakeList.filter(x=>x.status==='tour-scheduled').length, '#2563eb'],
                    ['📋 Interview Scheduled', preIntakeList.filter(x=>x.status==='interview-scheduled').length, '#16a34a'],
                    ['⏰ Needs Interview Time', preIntakeList.filter(x=>x.status==='needs-interview-time').length, '#d97706'],
                    ['🏥 Mesivta / YK', `${preIntakeList.filter(x=>x.program==='mesivta').length} / ${preIntakeList.filter(x=>x.program==='yeshiva-ketana').length}`, '#7c3aed'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e8eaed', textAlign: 'center', borderTop: `3px solid ${color}` }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Leads list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['call-back', '📞 Calls to Return', '#dc2626'],
                    ['needs-interview-time', '⏰ Needs Interview Time Set', '#d97706'],
                    ['tour-scheduled', '🏫 Tour Scheduled', '#2563eb'],
                    ['interview-scheduled', '📋 Interview Scheduled', '#16a34a'],
                  ].map(([status, groupLabel, color]) => {
                    const group = preIntakeList.filter(x => x.status === status)
                    if (group.length === 0) return null
                    return (
                      <div key={status}>
                        <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase' }}>{groupLabel} ({group.length})</div>
                        {group.map((lead, i) => (
                          <div key={lead.id} onClick={() => setSelectedPreIntake(lead)}
                            style={{ background: '#fff', border: `1px solid #e8eaed`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '12px 16px', marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{lead.name || 'Unnamed Lead'}</div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                📞 {lead.phone} · {lead.program === 'mesivta' ? '🏫 Mesivta' : '📚 Yeshiva Ketana'}
                                {lead.tourDate && ` · Tour: ${lead.tourDate} ${lead.tourTime}`}
                                {lead.interviewDate && ` · Interview: ${lead.interviewDate} ${lead.interviewTime}`}
                              </div>
                              {lead.callNotes && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>"{lead.callNotes.slice(0,60)}{lead.callNotes.length > 60 ? '...' : ''}"</div>}
                            </div>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>View →</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PRE-INTAKE PROFILE */}
            {intakeSection === 'pre' && selectedPreIntake && (
              <div>
                <button onClick={() => setSelectedPreIntake(null)} style={{ ...S.btn('ghost'), marginBottom: 16 }}>← Back to leads</button>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e8eaed', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  <div style={{ background: '#1a1f36', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <input value={selectedPreIntake.name} onChange={e => { setSelectedPreIntake(p => ({...p, name: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, name: e.target.value} : x)) }} placeholder="Full name..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, width: '100%', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[['mesivta','🏫 Mesivta'],['yeshiva-ketana','📚 Yeshiva Ketana']].map(([val, label]) => (
                          <button key={val} onClick={() => { setSelectedPreIntake(p => ({...p, program: val})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, program: val} : x)) }} style={{ padding: '2px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedPreIntake.program === val ? '#fff' : 'rgba(255,255,255,0.15)', color: selectedPreIntake.program === val ? '#1a1f36' : '#fff' }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <input value={selectedPreIntake.phone} onChange={e => { setSelectedPreIntake(p => ({...p, phone: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, phone: e.target.value} : x)) }} placeholder="Phone..." style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 14, width: 160 }} />
                  </div>

                  <div style={{ padding: 20, background: '#f4f5f7', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Status pipeline */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📍 Status Pipeline</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          ['call-back', '📞 Call Back'],
                          ['tour-scheduled', '🏫 Schedule Tour'],
                          ['needs-interview-time', '⏰ Set Interview Time'],
                          ['interview-scheduled', '📋 Interview Scheduled'],
                          ['move-to-applicant', '✅ Move to Applicants'],
                        ].map(([val, label]) => (
                          <button key={val} onClick={() => {
                            if (val === 'move-to-applicant') {
                              // Move to applicants list
                              const newApp = { id: Date.now(), name: selectedPreIntake.name, dob: '', currentSchool: '', shul: '', heardAbout: 'Pre-intake lead', fatherName: '', fatherPhone: selectedPreIntake.phone, motherName: '', motherMaiden: '', motherPhone: '', address: '', status: 'applicant', diagnoses: [], issues: selectedPreIntake.callNotes, interviewNotes: '', scores: { math: 0, reading: 0, comprehension: 0, social: 0, behavior: 0 }, documents: [] }
                              setIntakeList(prev => [...prev, newApp])
                              setPreIntakeList(prev => prev.filter(x => x.id !== selectedPreIntake.id))
                              setSelectedPreIntake(null)
                              setIntakeSection('applicants')
                              setSelectedIntake(newApp)
                              setIntakeTab('info')
                            } else {
                              setSelectedPreIntake(p => ({...p, status: val}))
                              setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, status: val} : x))
                            }
                          }} style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${selectedPreIntake.status === val ? '#1a1f36' : '#e5e7eb'}`, background: selectedPreIntake.status === val ? '#1a1f36' : '#fff', color: selectedPreIntake.status === val ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Tour & Interview scheduling */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🏫 Tour</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Date</div>
                            <input type="date" value={selectedPreIntake.tourDate} onChange={e => { setSelectedPreIntake(p => ({...p, tourDate: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, tourDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Time</div>
                            <input type="time" value={selectedPreIntake.tourTime} onChange={e => { setSelectedPreIntake(p => ({...p, tourTime: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, tourTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </div>
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Interview</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Date</div>
                            <input type="date" value={selectedPreIntake.interviewDate} onChange={e => { setSelectedPreIntake(p => ({...p, interviewDate: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, interviewDate: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Time</div>
                            <input type="time" value={selectedPreIntake.interviewTime} onChange={e => { setSelectedPreIntake(p => ({...p, interviewTime: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, interviewTime: e.target.value} : x)) }} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call notes */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📞 Call Notes</div>
                      <textarea value={selectedPreIntake.callNotes} onChange={e => { setSelectedPreIntake(p => ({...p, callNotes: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, callNotes: e.target.value} : x)) }} placeholder="Notes from the call — who called, what was discussed, any concerns..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 90, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>

                    {/* Follow-up notes */}
                    <div style={S.card}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📝 Follow-Up Notes</div>
                      <textarea value={selectedPreIntake.followUpNotes} onChange={e => { setSelectedPreIntake(p => ({...p, followUpNotes: e.target.value})); setPreIntakeList(prev => prev.map(x => x.id === selectedPreIntake.id ? {...x, followUpNotes: e.target.value} : x)) }} placeholder="Reminders, next steps..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 60, boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICANTS SECTION */}
            {intakeSection === 'applicants' && (
            <div>
            {selectedIntake ? (
              // ── INTAKE PROFILE ──
              <div>
                <button onClick={() => setSelectedIntake(null)} style={{ ...S.btn('ghost'), marginBottom: 16 }}>← Back to list</button>
                <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e8eaed' }}>
                  {/* Header */}
                  <div style={{ background: '#1a1f36', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#374151', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initials(selectedIntake.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{selectedIntake.name}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {[['applicant','🔵 Applicant','#3b82f6'],['interviewed','🟡 Interviewed','#f59e0b'],['accepted','🟢 Accepted','#16a34a'],['enrolled','⭐ Enrolled','#854d0e']].map(([val, label, color]) => (
                          <button key={val} onClick={() => setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, status: val} : x))} style={{ padding: '2px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedIntake.status === val ? color : 'rgba(255,255,255,0.15)', color: '#fff' }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ color: '#fff', textAlign: 'right' }}>
                      {selectedIntake.dob && <div style={{ fontSize: 13, opacity: 0.8 }}>Age: {new Date().getFullYear() - new Date(selectedIntake.dob).getFullYear()}</div>}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', padding: '0 24px', background: '#fafafa' }}>
                    {[['info','👤 Info'],['family','👨‍👩‍👦 Family'],['assessment','📊 Assessment'],['documents','📁 Documents']].map(([t, label]) => (
                      <button key={t} onClick={() => setIntakeTab(t)} style={{ padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: intakeTab === t ? 700 : 400, borderBottom: intakeTab === t ? '2px solid #1a1f36' : '2px solid transparent', color: intakeTab === t ? '#1a1f36' : '#6b7280' }}>{label}</button>
                    ))}
                  </div>

                  <div style={{ padding: '20px 24px', background: '#f4f5f7' }}>

                    {intakeTab === 'info' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div style={S.card}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Basic Information</div>
                          {[
                            ['Full Name', 'name', 'text'],
                            ['Date of Birth', 'dob', 'date'],
                            ['Current School / Yeshiva', 'currentSchool', 'text'],
                            ['Shul Affiliated', 'shul', 'text'],
                            ['How heard about Hadran', 'heardAbout', 'text'],
                          ].map(([label, key, type]) => (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                              <input type={type} value={selectedIntake[key]||''} onChange={e => { setSelectedIntake(prev => ({...prev, [key]: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, [key]: e.target.value} : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Diagnoses</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                              {selectedIntake.diagnoses?.map((d, i) => (
                                <span key={i} style={{ ...S.badge('#5b21b6','#f5f3ff'), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {d}
                                  <span onClick={() => { const updated = selectedIntake.diagnoses.filter((_,j) => j!==i); setSelectedIntake(prev => ({...prev, diagnoses: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, diagnoses: updated} : x)) }} style={{ cursor: 'pointer', fontWeight: 700 }}>✕</span>
                                </span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input id="diagInput" placeholder="Add diagnosis..." style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { const val = (e.target as HTMLInputElement).value.trim(); const updated = [...(selectedIntake.diagnoses||[]), val]; setSelectedIntake(prev => ({...prev, diagnoses: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, diagnoses: updated} : x)); (e.target as HTMLInputElement).value = '' } }} />
                            </div>
                          </div>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Issues / Background Notes</div>
                            <textarea value={selectedIntake.issues||''} onChange={e => { setSelectedIntake(prev => ({...prev, issues: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, issues: e.target.value} : x)) }} placeholder="Known issues, background..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                          </div>
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Interview Notes</div>
                            <textarea value={selectedIntake.interviewNotes||''} onChange={e => { setSelectedIntake(prev => ({...prev, interviewNotes: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, interviewNotes: e.target.value} : x)) }} placeholder="Notes from intake interview..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, minHeight: 80, boxSizing: 'border-box', resize: 'vertical' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {intakeTab === 'family' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[['Father', 'father'],['Mother', 'mother']].map(([label, prefix]) => (
                          <div key={prefix} style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{label === 'Father' ? '👨' : '👩'} {label}</div>
                            {[
                              [`${label} Name`, `${prefix}Name`],
                              [`${label} Phone`, `${prefix}Phone`],
                              ...(prefix === 'mother' ? [["Mother's Maiden Name", 'motherMaiden']] : []),
                            ].map(([lbl, key]) => (
                              <div key={key} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>{lbl}</div>
                                <input value={selectedIntake[key]||''} onChange={e => { setSelectedIntake(prev => ({...prev, [key]: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, [key]: e.target.value} : x)) }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                              </div>
                            ))}
                          </div>
                        ))}
                        <div style={{ ...S.card, gridColumn: 'span 2' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏠 Home Address</div>
                          <input value={selectedIntake.address||''} onChange={e => { setSelectedIntake(prev => ({...prev, address: e.target.value})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, address: e.target.value} : x)) }} placeholder="Full address..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {intakeTab === 'assessment' && (
                      <div>
                        <div style={{ ...S.card, marginBottom: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📊 Assessment Scores <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>(1 = Below Average, 5 = Excellent)</span></div>
                          {[
                            ['Math', 'math', '🔢'],
                            ['Reading', 'reading', '📖'],
                            ['Reading Comprehension', 'comprehension', '🧠'],
                            ['Social Skills', 'social', '👥'],
                            ['Behavior', 'behavior', '⭐'],
                          ].map(([label, key, icon]) => {
                            const val = selectedIntake.scores?.[key] || 0
                            const color = val >= 4 ? '#16a34a' : val >= 3 ? '#d97706' : val > 0 ? '#dc2626' : '#9ca3af'
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <div style={{ width: 160, fontSize: 13, fontWeight: 600 }}>{icon} {label}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {[1,2,3,4,5].map(n => (
                                    <button key={n} onClick={() => { const updated = {...(selectedIntake.scores||{}), [key]: n}; setSelectedIntake(prev => ({...prev, scores: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, scores: updated} : x)) }} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${val >= n ? color : '#e5e7eb'}`, background: val >= n ? color : '#fff', color: val >= n ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{n}</button>
                                  ))}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color, minWidth: 60 }}>
                                  {val === 0 ? '—' : val === 1 ? 'Below Avg' : val === 2 ? 'Developing' : val === 3 ? 'Average' : val === 4 ? 'Above Avg' : 'Excellent'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Radar chart visual */}
                        {Object.values(selectedIntake.scores||{}).some(v => v > 0) && (
                          <div style={S.card}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Score Summary</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {[['Math','math'],['Reading','reading'],['Comprehension','comprehension'],['Social','social'],['Behavior','behavior']].map(([label, key]) => {
                                const val = selectedIntake.scores?.[key] || 0
                                const pct = val / 5 * 100
                                const color = val >= 4 ? '#16a34a' : val >= 3 ? '#d97706' : val > 0 ? '#dc2626' : '#e5e7eb'
                                return (
                                  <div key={key} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ height: 80, background: '#f4f5f7', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', marginBottom: 4 }}>
                                      <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: '#6b7280' }}>{label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color }}>{val || '—'}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {intakeTab === 'documents' && (
                      <div style={S.card}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📁 Documents & Assessments</div>
                        {selectedIntake.documents?.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>No documents uploaded yet.</div>}
                        {selectedIntake.documents?.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f4f5f7', borderRadius: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>Uploaded: {doc.date}</div>
                            </div>
                            <button onClick={() => { const updated = selectedIntake.documents.filter((_,j) => j!==i); setSelectedIntake(prev => ({...prev, documents: updated})); setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, documents: updated} : x)) }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                          </div>
                        ))}
                        <div style={{ marginTop: 14, borderTop: '1px solid #e8eaed', paddingTop: 14 }}>
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Upload a document (file name saved for demo — real uploads need database)</div>
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const newDoc = { name: file.name, date: new Date().toISOString().slice(0,10) }
                              const updated = [...(selectedIntake.documents||[]), newDoc]
                              setSelectedIntake(prev => ({...prev, documents: updated}))
                              setIntakeList(prev => prev.map(x => x.id === selectedIntake.id ? {...x, documents: updated} : x))
                              e.target.value = ''
                            }
                          }} style={{ fontSize: 13 }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // ── INTAKE LIST ──
              <div>
                {/* Status filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[['all','All'],['applicant','🔵 Applicant'],['interviewed','🟡 Interviewed'],['accepted','🟢 Accepted'],['enrolled','⭐ Enrolled']].map(([val, label]) => (
                    <button key={val} onClick={() => {}} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{label} {val !== 'all' ? `(${intakeList.filter(x => x.status === val).length})` : `(${intakeList.length})`}</button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {intakeList.map((app, i) => {
                    const age = app.dob ? new Date().getFullYear() - new Date(app.dob).getFullYear() : null
                    const statusColors = { applicant: '#3b82f6', interviewed: '#f59e0b', accepted: '#16a34a', enrolled: '#854d0e' }
                    const statusLabels = { applicant: '🔵 Applicant', interviewed: '🟡 Interviewed', accepted: '🟢 Accepted', enrolled: '⭐ Enrolled' }
                    const avgScore = Object.values(app.scores||{}).filter(v => v > 0).length > 0 ? Math.round(Object.values(app.scores).filter(v => v > 0).reduce((a,b) => a+b, 0) / Object.values(app.scores).filter(v => v > 0).length * 10) / 10 : null
                    return (
                      <div key={app.id} onClick={() => { setSelectedIntake(app); setIntakeTab('info') }} style={{ ...S.card, cursor: 'pointer', borderLeft: `4px solid ${statusColors[app.status] || '#9ca3af'}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(app.name)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{app.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{age ? `Age ${age}` : ''}{app.currentSchool ? ` · ${app.currentSchool}` : ''}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <span style={{ background: statusColors[app.status] + '20', color: statusColors[app.status], padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{statusLabels[app.status]}</span>
                          <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#6b7280' }}>
                            {app.diagnoses?.length > 0 && <span>📋 {app.diagnoses.length} diag.</span>}
                            {app.documents?.length > 0 && <span>📁 {app.documents.length} docs</span>}
                            {avgScore && <span style={{ fontWeight: 700, color: avgScore >= 4 ? '#16a34a' : avgScore >= 3 ? '#d97706' : '#dc2626' }}>⭐ {avgScore}/5</span>}
                          </div>
                        </div>
                        {app.shul && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>🕍 {app.shul}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            </div>
            )}
          </div>
        )}

        {page === 'todo' && role === 'admin' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>📋 To-Do List</h1>
            {/* Add new */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add New Task</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Task description..." onKeyDown={e => { if (e.key === 'Enter' && newTodo.trim()) { setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: newTodoTime, text: newTodo, category: newTodoCategory, done: false }]); setNewTodo(''); setNewTodoTime('') } }} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, minWidth: 200 }} />
                <input value={newTodoTime} onChange={e => setNewTodoTime(e.target.value)} placeholder="Time (e.g. 10:30 AM)" style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, width: 160 }} />
                <select value={newTodoCategory} onChange={e => setNewTodoCategory(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Phone Call</option>
                  <option value="announcement">Announcement</option>
                  <option value="appointment">Appointment</option>
                </select>
                <button onClick={() => { if (!newTodo.trim()) return; setTodos(prev => [...prev, { id: Date.now(), date: new Date().toISOString().slice(0,10), time: newTodoTime, text: newTodo, category: newTodoCategory, done: false }]); setNewTodo(''); setNewTodoTime('') }} style={S.btn('primary')}>+ Add</button>
              </div>
            </div>

            {/* Todo list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Pending */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pending ({todos.filter(t => !t.done).length})</div>
              {todos.filter(t => !t.done).map(todo => {
                const catColors = { meeting: ['#5b21b6','#f5f3ff'], call: ['#166534','#dcfce7'], announcement: ['#92400e','#fef3c7'], appointment: ['#1d4ed8','#dbeafe'], general: ['#374151','#f4f5f7'] }
                const [cc, cb] = catColors[todo.category] || catColors.general
                return (
                  <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: true } : t))} style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{todo.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>📅 {todo.date}{todo.time ? ` · ${todo.time}` : ''}</span>
                        <span style={S.badge(cc, cb)}>{todo.category}</span>
                      </div>
                    </div>
                    <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
                  </div>
                )
              })}
              {todos.filter(t => !t.done).length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>All done! ✅</div>}

              {/* Done */}
              {todos.filter(t => t.done).length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Completed ({todos.filter(t => t.done).length})</div>
                  {todos.filter(t => t.done).map(todo => (
                    <div key={todo.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', opacity: 0.5 }}>
                      <input type="checkbox" checked={todo.done} onChange={() => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: false } : t))} style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13, color: '#6b7280' }}>{todo.text}</div>
                      <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      </div>

      {drillDown && <DrillDown title={drillDown.title} students={drillDown.students} onClose={() => setDrillDown(null)} onSelectStudent={s => { openStudent(s); setDrillDown(null) }} />}
      {selectedStudent && <StudentProfile student={selectedStudent} students={students} setStudents={setStudents} onClose={() => setSelectedStudent(null)} role={role} defaultTab={selectedStudentTab} />}
    </div>
  )
}
