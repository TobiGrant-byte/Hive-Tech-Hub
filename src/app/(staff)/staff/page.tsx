'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { usePreventBack } from '@/hooks/usePreventBack'
import { formatDateTime } from '@/utils/formatDate'
import BeeLoader from '@/components/BeeLoader'
import styles from './staff.module.css'
import FilePreview from '@/components/FilePreview'

export const dynamic = 'force-dynamic'

type Tab = 'overview' | 'assignments' | 'diary' | 'checkin'

export default function StaffPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    usePreventBack('/staff')

    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [assignments, setAssignments] = useState<any[]>([])
    const [diaryEntries, setDiaryEntries] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    // Grading
    const [gradingId, setGradingId] = useState<string | null>(null)
    const [gradingStudent, setGradingStudent] = useState<string>('')
    const [grade, setGrade] = useState('')
    const [feedback, setFeedback] = useState('')
    const [gradeLoading, setGradeLoading] = useState(false)
    const [confirmGrade, setConfirmGrade] = useState(false)

    // Diary
    const [diaryTopic, setDiaryTopic] = useState('')
    const [diaryWeek, setDiaryWeek] = useState('')
    const [diaryStudents, setDiaryStudents] = useState('')
    const [diaryNotes, setDiaryNotes] = useState('')
    const [diaryLoading, setDiaryLoading] = useState(false)
    const [diarySaved, setDiarySaved] = useState(false)

    // Check in/out
    const [todayEntry, setTodayEntry] = useState<any>(null)
    const [checkLoading, setCheckLoading] = useState(false)

    useEffect(() => {
        if (authLoading) return
        if (!profile) { router.replace('/login'); return }
        if (profile.role !== 'staff') { router.replace('/login'); return }
        fetchAll()
    }, [authLoading, profile])

    const fetchAll = async () => {
        if (!profile) return
        setDataLoading(true)

        const today = new Date().toISOString().split('T')[0]

        const [
            { data: assignmentsData },
            { data: diaryData },
            { data: todayDiary },
        ] = await Promise.all([
            supabase
                .from('assignments')
                .select('*')
                .eq('instructor_code', profile.instructor_code)
                .order('submitted_at', { ascending: false }),
            supabase
                .from('diary_entries')
                .select('*')
                .eq('staff_id', profile.id)
                .order('created_at', { ascending: false }),
            supabase
                .from('diary_entries')
                .select('*')
                .eq('staff_id', profile.id)
                .gte('created_at', today)
                .maybeSingle(),
        ])

        setAssignments(assignmentsData || [])
        setDiaryEntries(diaryData || [])
        setTodayEntry(todayDiary)
        setDataLoading(false)
    }

    const copyCode = () => {
        if (!profile?.instructor_code) return
        navigator.clipboard.writeText(profile.instructor_code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const submitGrade = async (assignmentId: string) => {
        if (!grade.trim()) return
        setGradeLoading(true)
        await supabase
            .from('assignments')
            .update({
                grade: grade.trim(),
                feedback: feedback.trim() || null,
                graded_at: new Date().toISOString(),
            })
            .eq('id', assignmentId)

        setGradingId(null)
        setGradingStudent('')
        setConfirmGrade(false)
        setGrade('')
        setFeedback('')
        setGradeLoading(false)
        fetchAll()
    }

    const saveDiary = async () => {
        if (!profile || !diaryTopic.trim()) return
        setDiaryLoading(true)

        await supabase.from('diary_entries').insert({
            staff_id: profile.id,
            topic: diaryTopic.trim(),
            week_number: parseInt(diaryWeek) || 0,
            students_present: parseInt(diaryStudents) || 0,
            notes: diaryNotes.trim(),
            file_urls: [],
        })

        setDiaryTopic('')
        setDiaryWeek('')
        setDiaryStudents('')
        setDiaryNotes('')
        setDiarySaved(true)
        setDiaryLoading(false)
        setTimeout(() => setDiarySaved(false), 2500)
        fetchAll()
    }

    const handleCheckIn = async () => {
        if (!profile) return
        setCheckLoading(true)
        await supabase.from('diary_entries').insert({
            staff_id: profile.id,
            topic: 'Check-in',
            week_number: 0,
            students_present: 0,
            notes: '',
            file_urls: [],
            checkin_time: new Date().toISOString(),
        })
        setCheckLoading(false)
        fetchAll()
    }

    const handleCheckOut = async () => {
        if (!todayEntry) return
        setCheckLoading(true)
        await supabase
            .from('diary_entries')
            .update({ checkout_time: new Date().toISOString() })
            .eq('id', todayEntry.id)
        setCheckLoading(false)
        fetchAll()
    }

    const pending = assignments.filter(a => !a.grade)
    const graded = assignments.filter(a => a.grade)

    if (authLoading) return <BeeLoader text="Loading workspace..." />
    if (!profile) return null

    return (
        <div className={styles.container}>

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {profile.profile_picture_url ? (
                        <img src={profile.profile_picture_url} alt={profile.name} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}, {profile.name}!</p>
                        <p className={styles.roleText}>👨‍🏫 Instructor</p>
                        {profile.instructor_code && (
                            <p className={styles.codeText}>🔑 {profile.instructor_code}</p>
                        )}
                    </div>
                </div>
                <div className={styles.topRight}>
                    <button className={styles.navBtn} onClick={() => router.push('/main')}>
                        Main Page
                    </button>
                    <button className={styles.navBtn} onClick={() => router.push('/instructors')}>
                        Instructors
                    </button>
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {([
                    { key: 'overview', label: '📊 Overview' },
                    { key: 'assignments', label: `📋 Assignments${pending.length > 0 ? ` (${pending.length})` : ''}` },
                    { key: 'diary', label: '📓 Class Diary' },
                    { key: 'checkin', label: '⏱️ Check In/Out' },
                ] as { key: Tab; label: string }[]).map(tab => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.content}>

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className={styles.section}>
                        <div className={styles.statsRow}>
                            {[
                                { label: 'Total Received', value: assignments.length, icon: '📋', color: 'var(--accent)' },
                                { label: 'Pending Grade', value: pending.length, icon: '⏳', color: '#f87171' },
                                { label: 'Graded', value: graded.length, icon: '✅', color: '#4ade80' },
                                { label: 'Diary Entries', value: diaryEntries.length, icon: '📓', color: '#60a5fa' },
                            ].map(s => (
                                <div key={s.label} className={styles.statCard}>
                                    <span className={styles.statIcon}>{s.icon}</span>
                                    <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
                                    <span className={styles.statLabel}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* INST Code Card */}
                        <div className={styles.codeCard}>
                            <div className={styles.codeCardLeft}>
                                <p className={styles.codeCardLabel}>YOUR INSTRUCTOR CODE</p>
                                <p className={styles.codeCardValue}>{profile.instructor_code}</p>
                                <p className={styles.codeCardSub}>Share this with your students so they can submit assignments to you.</p>
                            </div>
                            <button
                                className={`${styles.copyBtn} ${copied ? styles.copySuccess : ''}`}
                                onClick={copyCode}
                            >
                                {copied ? '✅ Copied!' : '📋 Copy Code'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ASSIGNMENTS */}
                {activeTab === 'assignments' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Student Assignments
                            {pending.length > 0 && (
                                <span className={styles.pendingBadge}>{pending.length} need grading</span>
                            )}
                        </h2>

                        {dataLoading ? <BeeLoader text="Loading..." /> :
                            assignments.length === 0 ? (
                                <div className={styles.emptyState}><span>📭</span><p>No assignments yet.</p></div>
                            ) : (
                                <div className={styles.assignmentList}>
                                    {assignments.map(a => (
                                        <div key={a.id} className={styles.assignmentCard}>
                                            <div className={styles.assignmentHeader}>
                                                <div>
                                                    <p className={styles.studentName}>{a.student_name}</p>
                                                    <p className={styles.submittedAt}>
                                                        Submitted {formatDateTime(a.submitted_at)}
                                                    </p>
                                                </div>
                                                {a.grade ? (
                                                    <div className={styles.gradedTag}>
                                                        <span className={styles.gradeValue}>{a.grade}</span>
                                                        <span className={styles.gradedLabel}>Graded</span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.ungradedTag}>⏳ Pending</span>
                                                )}
                                            </div>

                                            {a.content_text && (
                                                <p className={styles.assignmentContent}>{a.content_text}</p>
                                            )}

                                            {a.file_url && (
                                                <FilePreview fileUrl={a.file_url} />
                                            )}

                                            {a.feedback && (
                                                <p className={styles.feedbackText}>💬 {a.feedback}</p>
                                            )}

                                            {!a.grade && (
                                                gradingId === a.id ? (
                                                    <div className={styles.gradeForm}>
                                                        <input
                                                            className="input"
                                                            placeholder="Grade (e.g. A, B+, 85%)"
                                                            value={grade}
                                                            onChange={e => setGrade(e.target.value)}
                                                        />
                                                        <textarea
                                                            className={`input ${styles.feedbackInput}`}
                                                            placeholder="Feedback (optional)"
                                                            value={feedback}
                                                            onChange={e => setFeedback(e.target.value)}
                                                            rows={2}
                                                        />
                                                        <div className={styles.gradeActions}>
                                                            <button
                                                                className="btn-primary"
                                                                onClick={() => {
                                                                    setGradingStudent(a.student_name)
                                                                    setConfirmGrade(true)
                                                                }}
                                                                disabled={!grade.trim()}
                                                            >
                                                                ✅ Submit Grade
                                                            </button>
                                                            <button
                                                                className={styles.cancelBtn}
                                                                onClick={() => {
                                                                    setGradingId(null)
                                                                    setGrade('')
                                                                    setFeedback('')
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className={styles.gradeBtn}
                                                        onClick={() => setGradingId(a.id)}
                                                    >
                                                        ✏️ Grade this assignment
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </div>
                )}

                {/* DIARY */}
                {activeTab === 'diary' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Class Diary</h2>

                        <div className={styles.diaryForm}>
                            <h3 className={styles.formTitle}>Log Today&#39;s Class</h3>
                            <div className={styles.formRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>TOPIC COVERED</label>
                                    <input className="input" placeholder="e.g. React Hooks"
                                           value={diaryTopic} onChange={e => setDiaryTopic(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>WEEK NUMBER</label>
                                    <input className="input" type="number" placeholder="e.g. 4"
                                           value={diaryWeek} onChange={e => setDiaryWeek(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>STUDENTS PRESENT</label>
                                    <input className="input" type="number" placeholder="e.g. 12"
                                           value={diaryStudents} onChange={e => setDiaryStudents(e.target.value)} />
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>NOTES</label>
                                <textarea className={`input ${styles.notesInput}`}
                                          placeholder="Class observations, what went well, what to improve..."
                                          value={diaryNotes} onChange={e => setDiaryNotes(e.target.value)}
                                          rows={4} />
                            </div>
                            <button className="btn-primary" onClick={saveDiary}
                                    disabled={diaryLoading || !diaryTopic.trim()}>
                                {diarySaved ? '✅ Saved!' : diaryLoading ? 'Saving...' : '📓 Save Entry'}
                            </button>
                        </div>

                        {diaryEntries.length > 0 && (
                            <div className={styles.diaryList}>
                                <h3 className={styles.formTitle}>Previous Entries</h3>
                                {diaryEntries.map(entry => (
                                    <div key={entry.id} className={styles.diaryCard}>
                                        <div className={styles.diaryHeader}>
                                            <div>
                                                <p className={styles.diaryTopic}>{entry.topic}</p>
                                                <p className={styles.diaryMeta}>
                                                    Week {entry.week_number} · {entry.students_present} students · {formatDateTime(entry.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {entry.notes && (
                                            <p className={styles.diaryNotes}>{entry.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CHECK IN/OUT */}
                {activeTab === 'checkin' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Attendance</h2>
                        <p className={styles.sectionSub}>Log when you arrive and leave for the day.</p>

                        <div className={styles.checkCard}>
                            <div className={styles.checkStatus}>
                                <div className={`${styles.checkDot} ${todayEntry?.checkin_time ? styles.checkDotActive : ''}`} />
                                <div>
                                    <p className={styles.checkLabel}>TODAY&#39;S STATUS</p>
                                    <p className={styles.checkValue}>
                                        {!todayEntry?.checkin_time ? 'Not checked in yet' :
                                            !todayEntry?.checkout_time ? `Checked in at ${formatDateTime(todayEntry.checkin_time)}` :
                                                `Checked out at ${formatDateTime(todayEntry.checkout_time)}`}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.checkBtns}>
                                {!todayEntry?.checkin_time && (
                                    <button className={styles.checkInBtn} onClick={handleCheckIn} disabled={checkLoading}>
                                        {checkLoading ? '...' : '✅ Check In'}
                                    </button>
                                )}
                                {todayEntry?.checkin_time && !todayEntry?.checkout_time && (
                                    <button className={styles.checkOutBtn} onClick={handleCheckOut} disabled={checkLoading}>
                                        {checkLoading ? '...' : '👋 Check Out'}
                                    </button>
                                )}
                                {todayEntry?.checkout_time && (
                                    <p className={styles.allDoneText}>✅ All done for today!</p>
                                )}
                            </div>
                        </div>

                        {diaryEntries.filter(e => e.checkin_time).length > 0 && (
                            <div className={styles.attendanceHistory}>
                                <h3 className={styles.formTitle}>Attendance History</h3>
                                {diaryEntries.filter(e => e.checkin_time).map(entry => (
                                    <div key={entry.id} className={styles.attendanceRow}>
                                        <span className={styles.attendanceDate}>{formatDateTime(entry.checkin_time)}</span>
                                        <div className={styles.attendanceTimes}>
                                            <span className={styles.timeIn}>In: {formatDateTime(entry.checkin_time)}</span>
                                            {entry.checkout_time && (
                                                <span className={styles.timeOut}>Out: {formatDateTime(entry.checkout_time)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* ── CONFIRM GRADE MODAL ── */}
            {confirmGrade && gradingId && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '20px',
                    }}
                    onClick={() => setConfirmGrade(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '36px 32px',
                            maxWidth: '420px', width: '100%',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '16px',
                            textAlign: 'center',
                            boxShadow: 'var(--shadow)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: '48px' }}>📝</div>

                        <h2 style={{
                            fontSize: '22px', fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontFamily: 'Georgia, serif',
                        }}>
                            Confirm Grade
                        </h2>

                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            You are about to submit a grade for{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>{gradingStudent}</strong>.
                            This will be visible to the student immediately.
                        </p>

                        <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            width: '100%',
                            display: 'flex', flexDirection: 'column', gap: '8px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>GRADE</span>
                                <span style={{
                                    fontSize: '24px', fontWeight: 700,
                                    color: 'var(--accent)', fontFamily: 'Georgia, serif',
                                }}>
                                    {grade}
                                </span>
                            </div>
                            {feedback.trim() && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>FEEDBACK</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {feedback}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
                            <button
                                onClick={() => setConfirmGrade(false)}
                                style={{
                                    flex: 1, padding: '13px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    fontSize: '14px', fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => submitGrade(gradingId)}
                                disabled={gradeLoading}
                                style={{
                                    flex: 1, padding: '13px',
                                    background: 'var(--accent)',
                                    color: 'var(--accent-text)',
                                    border: 'none', borderRadius: '10px',
                                    fontSize: '14px', fontWeight: 700,
                                    cursor: gradeLoading ? 'not-allowed' : 'pointer',
                                    opacity: gradeLoading ? 0.6 : 1,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {gradeLoading ? 'Submitting...' : '✅ Confirm & Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}