'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './student.module.css'

export default function StudentPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [journal, setJournal] = useState('')
    const [journalSaved, setJournalSaved] = useState(false)
    const [grades, setGrades] = useState<any[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        console.log('authLoading:', authLoading, '| profile:', profile?.role, '| status:', profile?.status)

        if (authLoading) return

        if (!profile) {
            const timer = setTimeout(() => {
                window.location.href = '/login'
            }, 1500)
            return () => clearTimeout(timer)
        }

        if (profile.role !== 'student') {
            window.location.href = '/login'
            return
        }

        fetchData(profile.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, profile])

    const fetchData = async (userId: string) => {
        setDataLoading(true)

        const [
            { data: journalData },
            { data: gradesData },
            { data: assignmentsData },
        ] = await Promise.all([
            supabase
                .from('student_journal')
                .select('content')
                .eq('student_id', userId)
                .maybeSingle(),
            supabase
                .from('assignments')
                .select('*')
                .eq('student_id', userId)
                .not('grade', 'is', null)
                .order('graded_at', { ascending: false }),
            supabase
                .from('assignments')
                .select('*')
                .eq('student_id', userId)
                .order('submitted_at', { ascending: false }),
        ])

        setJournal(journalData?.content || '')
        setGrades(gradesData || [])
        setAssignments(assignmentsData || [])
        setDataLoading(false)
    }

    const saveJournal = async () => {
        if (!profile) return

        await supabase
            .from('student_journal')
            .upsert({
                student_id: profile.id,
                content: journal,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'student_id' })

        setJournalSaved(true)
        setTimeout(() => setJournalSaved(false), 2000)
    }

    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--accent)',
                fontSize: '40px',
            }}>
                🐝
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className={styles.container}>

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {profile.profile_picture_url ? (
                        <img
                            src={profile.profile_picture_url}
                            alt={profile.name}
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className={styles.welcomeText}>
                            {greetingIcon} {greeting}, {profile.name}!
                        </p>
                        <p className={styles.roleText}>👨‍🎓 Student</p>
                        {profile.course && (
                            <p className={styles.courseText}>
                                {profile.course === 'webdev' && '🌐 Web Development'}
                                {profile.course === 'hatchdev' && '☕ HatchDev'}
                                {profile.course === 'scaffolding' && '📱 Scaffolding.dart'}
                            </p>
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
                    <button className={styles.signOutBtn} onClick={signOut}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* Student ID Card */}
            <div className={styles.idCard}>
                <div className={styles.idLeft}>
                    <p className={styles.idLabel}>STUDENT ID</p>
                    <p className={styles.idValue}>{profile.id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className={styles.idRight}>
                    <img src="/Hive%20logo.jpeg" alt="Hive Tech Hub" className={styles.idLogo} />
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsRow}>
                <button
                    className={styles.actionCard}
                    onClick={() => router.push('/submit-assignment')}
                >
                    <span className={styles.actionIcon}>📤</span>
                    <span className={styles.actionLabel}>Submit Assignment</span>
                    <span className={styles.actionSub}>Send work to your instructor</span>
                </button>

                <button
                    className={styles.actionCard}
                    onClick={() => router.push('/view-grades')}
                >
                    <span className={styles.actionIcon}>📊</span>
                    <span className={styles.actionLabel}>View Grades</span>
                    <span className={styles.actionSub}>{grades.length} grade{grades.length !== 1 ? 's' : ''} received</span>
                </button>

                <button
                    className={styles.actionCard}
                    onClick={() => router.push('/instructors')}
                >
                    <span className={styles.actionIcon}>👨‍🏫</span>
                    <span className={styles.actionLabel}>Instructors</span>
                    <span className={styles.actionSub}>Find instructor codes</span>
                </button>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{assignments.length}</span>
                    <span className={styles.statLabel}>Assignments Submitted</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{grades.length}</span>
                    <span className={styles.statLabel}>Grades Received</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {assignments.filter(a => !a.grade).length}
                    </span>
                    <span className={styles.statLabel}>Pending Grades</span>
                </div>
            </div>

            {/* Recent Grades */}
            {grades.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Recent Grades</h2>
                    <div className={styles.gradesList}>
                        {grades.slice(0, 3).map((g) => (
                            <div key={g.id} className={styles.gradeCard}>
                                <div className={styles.gradeLeft}>
                                    <p className={styles.gradeAssignment}>
                                        Assignment #{g.id.slice(0, 6)}
                                    </p>
                                    {g.feedback && (
                                        <p className={styles.gradeFeedback}>{g.feedback}</p>
                                    )}
                                </div>
                                <div className={styles.gradeBadge}>{g.grade}</div>
                            </div>
                        ))}
                    </div>
                    {grades.length > 3 && (
                        <button
                            className={styles.viewAllBtn}
                            onClick={() => router.push('/view-grades')}
                        >
                            View all grades →
                        </button>
                    )}
                </div>
            )}

            {/* Private Journal */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>My Private Journal</h2>
                    <span className={styles.privateTag}>🔒 Only you can see this</span>
                </div>
                <p className={styles.journalSub}>
                    Write your reflections, questions, goals, or notes here.
                </p>
                <textarea
                    className={`input ${styles.journalTextarea}`}
                    placeholder="What are you learning today? Any questions or goals?"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    rows={6}
                />
                <button
                    className="btn-primary"
                    onClick={saveJournal}
                    disabled={!journal.trim()}
                >
                    {journalSaved ? '✅ Saved!' : 'Save Journal'}
                </button>
            </div>

        </div>
    )
}