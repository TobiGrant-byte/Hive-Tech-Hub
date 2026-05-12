'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import BeeLoader from '@/components/BeeLoader'
import styles from './instructors.module.css'

export default function InstructorsPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [instructors, setInstructors] = useState<any[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return
        if (!profile) { router.replace('/login'); return }
        fetchInstructors()
    }, [authLoading, profile])

    const fetchInstructors = async () => {
        setDataLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('id, name, profile_picture_url, instructor_code, course, teaching_experience')
            .eq('role', 'staff')
            .eq('status', 'approved')
            .order('name')

        setInstructors(data || [])
        setDataLoading(false)
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(null), 2000)
    }

    const filtered = instructors.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.instructor_code?.toLowerCase().includes(search.toLowerCase())
    )

    if (authLoading) return <BeeLoader text="Loading instructors..." />
    if (!profile) return null

    return (
        <div className={styles.container}>

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <img src="/Hive%20logo.jpeg" alt="Hive Tech Hub" className={styles.logo} />
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}, {profile.name}!</p>
                        <p className={styles.roleText}>
                            {profile.role === 'admin' ? '🔐 Administrator' :
                                profile.role === 'staff' ? '👨‍🏫 Instructor' : '👨‍🎓 Student'}
                        </p>
                    </div>
                </div>
                <div className={styles.topRight}>
                    <button className={styles.navBtn} onClick={() => router.push('/main')}>
                        Main Page
                    </button>
                    {profile.role === 'student' && (
                        <button className={styles.navBtn} onClick={() => router.push('/student')}>
                            My Dashboard
                        </button>
                    )}
                    {profile.role === 'admin' && (
                        <button className={styles.navBtn} onClick={() => router.push('/admin')}>
                            Dashboard
                        </button>
                    )}
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                </div>
            </div>

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>👨‍🏫 Instructors</h1>
                <p className={styles.pageSub}>
                    Find your instructor and copy their code to submit assignments.
                </p>
            </div>

            {/* Search */}
            <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    className={`input ${styles.searchInput}`}
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Instructors Grid */}
            {dataLoading ? (
                <BeeLoader text="Loading..." />
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    <span>👨‍🏫</span>
                    <p>{search ? 'No instructors match your search.' : 'No instructors available yet.'}</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((instructor) => (
                        <div key={instructor.id} className={styles.card}>
                            <div className={styles.cardTop}>
                                {instructor.profile_picture_url ? (
                                    <img
                                        src={instructor.profile_picture_url}
                                        alt={instructor.name}
                                        className={styles.avatar}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {instructor.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className={styles.instructorName}>{instructor.name}</p>
                                    <p className={styles.instructorRole}>👨‍🏫 Instructor</p>
                                    {instructor.course && (
                                        <p className={styles.instructorCourse}>
                                            {instructor.course === 'webdev' ? '🌐 Web Development' :
                                                instructor.course === 'hatchdev' ? '☕ HatchDev' :
                                                    '📱 Scaffolding.dart'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {instructor.teaching_experience && (
                                <p className={styles.experience}>
                                    {instructor.teaching_experience.slice(0, 120)}
                                    {instructor.teaching_experience.length > 120 ? '...' : ''}
                                </p>
                            )}

                            {instructor.instructor_code && (
                                <div className={styles.codeRow}>
                                    <div className={styles.codeBox}>
                                        <span className={styles.codeLabel}>INSTRUCTOR CODE</span>
                                        <span className={styles.codeValue}>{instructor.instructor_code}</span>
                                    </div>
                                    <button
                                        className={`${styles.copyBtn} ${copied === instructor.instructor_code ? styles.copySuccess : ''}`}
                                        onClick={() => copyCode(instructor.instructor_code)}
                                    >
                                        {copied === instructor.instructor_code ? '✅ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}