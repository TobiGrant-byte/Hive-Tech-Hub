'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { formatDateTime } from '@/utils/formatDate'
import BeeLoader from '@/components/BeeLoader'
import styles from './view-grades.module.css'

export default function ViewGradesPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [assignments, setAssignments] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'graded' | 'pending'>('all')

    useEffect(() => {
        if (authLoading) return
        if (!profile) { router.replace('/login'); return }
        if (profile.role !== 'student') { router.replace('/login'); return }
        fetchAssignments()
    }, [authLoading, profile])

    const fetchAssignments = async () => {
        if (!profile) return
        setDataLoading(true)
        const { data } = await supabase
            .from('assignments')
            .select('*')
            .eq('student_id', profile.id)
            .order('submitted_at', { ascending: false })
        setAssignments(data || [])
        setDataLoading(false)
    }

    const filtered = assignments.filter(a => {
        if (filter === 'graded') return a.grade !== null
        if (filter === 'pending') return a.grade === null
        return true
    })

    const graded = assignments.filter(a => a.grade !== null)
    const pending = assignments.filter(a => a.grade === null)

    const getGradeColor = (grade: string) => {
        const g = grade?.toUpperCase()
        if (g?.startsWith('A')) return '#4ade80'
        if (g?.startsWith('B')) return 'var(--accent)'
        if (g?.startsWith('C')) return '#60a5fa'
        if (g?.startsWith('D')) return '#f87171'
        return 'var(--text-muted)'
    }

    if (authLoading) return <BeeLoader text="Loading grades..." />
    if (!profile) return null

    return (
        <div className={styles.container}>

            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {profile.profile_picture_url ? (
                        <img
                            src={profile.profile_picture_url}
                            alt={profile.name}
                            className={styles.logo}
                        />
                    ) : (
                        <div className={styles.avatarInitial}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}, {profile.name}!</p>
                        <p className={styles.roleText}>👨‍🎓 Student</p>
                    </div>
                </div>
                <div className={styles.topRight}>
                    <button className={styles.navBtn} onClick={() => router.push('/student')}>
                        ← My Page
                    </button>
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                </div>
            </div>

            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>📊 My Grades</h1>
                <p className={styles.pageSub}>Track all your submitted assignments and grades.</p>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{assignments.length}</span>
                    <span className={styles.statLabel}>Total Submitted</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: '#4ade80' }}>
                        {graded.length}
                    </span>
                    <span className={styles.statLabel}>Graded</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: 'var(--accent)' }}>
                        {pending.length}
                    </span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
            </div>

            <div className={styles.filterRow}>
                {(['all', 'graded', 'pending'] as const).map((f) => (
                    <button
                        key={f}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? '📋 All' : f === 'graded' ? '✅ Graded' : '⏳ Pending'}
                    </button>
                ))}
            </div>

            {dataLoading ? (
                <BeeLoader text="Fetching assignments..." />
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <span>📭</span>
                    <p>No assignments here yet.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filtered.map((a, i) => (
                        <div key={a.id} className={styles.assignmentCard}>
                            <div className={styles.cardLeft}>
                                <div className={styles.assignmentNum}>#{i + 1}</div>
                                <div className={styles.assignmentInfo}>
                                    <p className={styles.assignmentTitle}>
                                        Assignment {a.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p className={styles.assignmentMeta}>
                                        🔑 {a.instructor_code} · Submitted {formatDateTime(a.submitted_at)}
                                    </p>
                                    {a.content_text && (
                                        <p className={styles.assignmentPreview}>
                                            {a.content_text.slice(0, 100)}
                                            {a.content_text.length > 100 ? '...' : ''}
                                        </p>
                                    )}
                                    {a.file_url && (

                                        <a
                                        href={a.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.fileLink}
                                        >
                                        📎 View Attached File
                                        </a>
                                        )}
                                    {a.grade && a.feedback && (
                                        <p className={styles.feedbackText}>
                                            💬 {a.feedback}
                                        </p>
                                    )}
                                    {a.graded_at && (
                                        <p className={styles.gradedAt}>
                                            Graded {formatDateTime(a.graded_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className={styles.cardRight}>
                                {a.grade ? (
                                    <div
                                        className={styles.gradeBadge}
                                        style={{
                                            color: getGradeColor(a.grade),
                                            borderColor: getGradeColor(a.grade),
                                        }}
                                    >
                                        {a.grade}
                                    </div>
                                ) : (
                                    <div className={styles.pendingBadge}>
                                        <div className={styles.pendingDot} />
                                        Pending
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}