'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { formatDateTime } from '@/utils/formatDate'
import { usePreventBack } from '@/hooks/usePreventBack'
import type { Profile, Suggestion } from '@/types'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area,
} from 'recharts'
import styles from './admin.module.css'
import BeeLoader from '@/components/BeeLoader'

type Tab = 'overview' | 'approvals' | 'users' | 'suggestions' | 'posts'

export default function AdminDashboard() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const supabase = createClient()

    usePreventBack('/admin')

    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
    const [allUsers, setAllUsers] = useState<Profile[]>([])
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [postContent, setPostContent] = useState('')
    const [postLoading, setPostLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [userStats, setUserStats] = useState<any>(null)
    const [statsLoading, setStatsLoading] = useState(false)

    // Post file upload state — ADDED
    const [postFile, setPostFile] = useState<File | null>(null)
    const [postFileName, setPostFileName] = useState('')

    const [roleData, setRoleData] = useState<any[]>([])
    const [courseData, setCourseData] = useState<any[]>([])
    const [signupData, setSignupData] = useState<any[]>([])
    const [statusData, setStatusData] = useState<any[]>([])

    const GOLD = '#D4A017'
    const BLUE = '#60a5fa'
    const PURPLE = '#c084fc'
    const GREEN = '#4ade80'
    const RED = '#f87171'
    const COLORS = [GOLD, BLUE, PURPLE, GREEN, RED]

    useEffect(() => {
        if (authLoading) return
        if (!profile || profile.role !== 'admin') {
            window.location.href = '/login'
            return
        }
        fetchAll()

        const channel = supabase
            .channel('admin-profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAll())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [authLoading, profile])

    const fetchAll = async () => {
        setLoading(true)

        const [
            { data: pending },
            { data: users },
            { data: sug },
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
            supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
            supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
        ])

        const u = users || []
        setPendingUsers(pending || [])
        setAllUsers(u)
        setSuggestions(sug || [])

        setRoleData([
            { name: 'Students', value: u.filter(x => x.role === 'student').length },
            { name: 'Staff', value: u.filter(x => x.role === 'staff').length },
        ])

        setStatusData([
            { name: 'Approved', value: u.filter(x => x.status === 'approved').length },
            { name: 'Pending', value: u.filter(x => x.status === 'pending').length },
            { name: 'Rejected', value: u.filter(x => x.status === 'rejected').length },
        ])

        const courseMap: Record<string, number> = {}
        u.forEach(x => {
            if (x.course) {
                const label = x.course === 'webdev' ? 'Web Dev' : x.course === 'hatchdev' ? 'HatchDev' : 'Flutter'
                courseMap[label] = (courseMap[label] || 0) + 1
            }
        })
        setCourseData(Object.entries(courseMap).map(([name, value]) => ({ name, value })))

        const days: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            days[key] = 0
        }
        u.forEach(x => {
            const key = new Date(x.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (key in days) days[key]++
        })
        setSignupData(Object.entries(days).map(([date, signups]) => ({ date, signups })))

        setLoading(false)
    }

    const approveUser = async (userId: string) => {
        await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)
        fetchAll()
    }

    const rejectUser = async (userId: string) => {
        await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId)
        fetchAll()
    }

    const createPost = async () => {
        if (!postContent.trim() || !profile) return
        setPostLoading(true)

        let fileUrl: string | null = null

        if (postFile) {
            const fileExt = postFile.name.split('.').pop()
            const fileName = `post-${profile.id}-${Date.now()}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('posts')
                .upload(fileName, postFile, { upsert: true })

            if (uploadError) {
                console.error('Upload error:', uploadError.message)
                alert(`File upload failed: ${uploadError.message}`)
                setPostLoading(false)
                return
            }

            console.log('Upload success:', uploadData)

            const { data: urlData } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName)

            fileUrl = urlData.publicUrl
            console.log('File URL:', fileUrl)
        }

        const { error: insertError } = await supabase.from('posts').insert({
            author_id: profile.id,
            content: postContent.trim(),
            file_url: fileUrl,
        })

        if (insertError) {
            console.error('Insert error:', insertError.message)
            alert(`Post failed: ${insertError.message}`)
            setPostLoading(false)
            return
        }

        setPostContent('')
        setPostFile(null)
        setPostFileName('')
        setPostLoading(false)
        alert('Post published!')
    }

    const fetchUserStats = async (user: Profile) => {
        setSelectedUser(user)
        setStatsLoading(true)
        setUserStats(null)

        if (user.role === 'student') {
            const [{ data: assignments }, { data: graded }] = await Promise.all([
                supabase.from('assignments').select('id').eq('student_id', user.id),
                supabase.from('assignments').select('grade, feedback').eq('student_id', user.id).not('grade', 'is', null),
            ])
            setUserStats({ type: 'student', assignmentsSubmitted: assignments?.length || 0, grades: graded || [] })
        }

        if (user.role === 'staff') {
            const { data: received } = await supabase
                .from('assignments').select('id').eq('instructor_code', user.instructor_code)
            setUserStats({ type: 'staff', assignmentsReceived: received?.length || 0 })
        }

        setStatsLoading(false)
    }

    const tooltipStyle = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
    }

    const renderUserCard = (user: Profile, showActions = false) => (
        <div key={user.id} className={styles.userCard} onClick={() => fetchUserStats(user)} style={{ cursor: 'pointer' }}>
            <div className={styles.userInfo}>
                {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt={user.name} className={styles.avatar} />
                ) : (
                    <div className={styles.avatarPlaceholder}>{user.name?.charAt(0).toUpperCase()}</div>
                )}
                <div>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>{user.email}</p>
                    <div className={styles.userMeta}>
                        <span className={`${styles.badge} ${user.role === 'staff' ? styles.badgeStaff : styles.badgeStudent}`}>{user.role}</span>
                        <span className={`${styles.badge} ${user.status === 'approved' ? styles.badgeApproved : user.status === 'pending' ? styles.badgePending : styles.badgeRejected}`}>{user.status}</span>
                        {user.instructor_code && <span className={styles.instructorCode}>🔑 {user.instructor_code}</span>}
                        {user.course && (
                            <span className={styles.course}>
                                {user.course === 'webdev' ? '🌐 Web Dev' : user.course === 'hatchdev' ? '☕ HatchDev' : '📱 Flutter'}
                            </span>
                        )}
                        {user.teaching_experience && (
                            <span className={styles.experience}>📝 {user.teaching_experience.slice(0, 60)}...</span>
                        )}
                    </div>
                    {user.created_at && <p className={styles.userDate}>Joined {formatDateTime(user.created_at)}</p>}
                </div>
            </div>
            {showActions && (
                <div className={styles.userActions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.approveBtn} onClick={() => approveUser(user.id)}>✅ Approve</button>
                    <button className={styles.rejectBtn} onClick={() => rejectUser(user.id)}>❌ Reject</button>
                </div>
            )}
        </div>
    )

    if (authLoading) return <BeeLoader text="Loading dashboard..." />

    if (!profile) return null

    return (
        <div className={styles.container}>

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    {profile.profile_picture_url ? (
                        <img src={profile.profile_picture_url} alt={profile.name} className={styles.logo} />
                    ) : (
                        <div className={styles.logoPlaceholder}>{profile.name?.charAt(0).toUpperCase() || 'A'}</div>
                    )}
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}</p>
                        <h2 className={styles.adminName}>{profile.name}</h2>
                        <p className={styles.adminRole}>Administrator</p>
                    </div>
                </div>
                <div className={styles.topRight}>
                    <div className={styles.liveIndicator}>
                        <div className={styles.liveDot} />
                        <span>Live</span>
                    </div>
                    <button className={styles.navBtn} onClick={() => window.location.href = '/main'}>
                        Main Page
                    </button>
                    <button className={styles.navBtn} onClick={() => window.location.href = '/admin/edit-profile'}>
                        ✏️ Edit Profile
                    </button>
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {([
                    { key: 'overview', label: '📊 Overview' },
                    { key: 'approvals', label: `✅ Approvals${pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}` },
                    { key: 'users', label: '👥 Users' },
                    { key: 'suggestions', label: '💬 Suggestions' },
                    { key: 'posts', label: '📝 Post Update' },
                ] as { key: Tab; label: string }[]).map((tab) => (
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
                    <div className={styles.overviewGrid}>
                        <div className={styles.statRow}>
                            {[
                                { label: 'Total Students', value: allUsers.filter(u => u.role === 'student').length, icon: '👨‍🎓', color: BLUE },
                                { label: 'Total Staff', value: allUsers.filter(u => u.role === 'staff').length, icon: '👨‍🏫', color: PURPLE },
                                { label: 'Pending', value: pendingUsers.length, icon: '⏳', color: GOLD },
                                { label: 'Suggestions', value: suggestions.length, icon: '💬', color: GREEN },
                            ].map((stat) => (
                                <div key={stat.label} className={styles.statCard}>
                                    <div className={styles.statTop}>
                                        <span className={styles.statIcon}>{stat.icon}</span>
                                        <span className={styles.statValue} style={{ color: stat.color }}>{stat.value}</span>
                                    </div>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                    <div className={styles.statBar} style={{ background: stat.color, opacity: 0.2 }} />
                                </div>
                            ))}
                        </div>

                        <div className={styles.chartsRow}>
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>Users by Role</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                            {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>Users by Status</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                            {statusData.map((_, i) => <Cell key={i} fill={[GREEN, GOLD, RED][i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>Enrolment by Course</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={courseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" fill={GOLD} radius={[6, 6, 0, 0]} name="Users" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.chartsRowFull}>
                            <div className={styles.chartCardWide}>
                                <h3 className={styles.chartTitle}>New Signups — Last 7 Days</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={signupData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="signups" stroke={GOLD} strokeWidth={2.5} fill="url(#goldGradient)" name="Signups" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* APPROVALS */}
                {activeTab === 'approvals' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Pending Approvals</h2>
                        {loading ? <p className={styles.empty}>Loading...</p> :
                            pendingUsers.length === 0 ? (
                                <div className={styles.emptyState}><span>🎉</span><p>No pending approvals</p></div>
                            ) : (
                                <div className={styles.cardList}>{pendingUsers.map(u => renderUserCard(u, true))}</div>
                            )
                        }
                    </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            All Users <span className={styles.userCount}>{allUsers.length} total</span>
                        </h2>
                        <p className={styles.sectionSub}>Click any user to see their stats.</p>
                        <div className={styles.cardList}>{allUsers.map(u => renderUserCard(u, false))}</div>
                    </div>
                )}

                {/* SUGGESTIONS */}
                {activeTab === 'suggestions' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            Suggestion Box Inbox <span className={styles.userCount}>{suggestions.length} total</span>
                        </h2>
                        {suggestions.length === 0 ? (
                            <div className={styles.emptyState}><span>📭</span><p>No suggestions yet</p></div>
                        ) : (
                            <div className={styles.cardList}>
                                {suggestions.map((s) => (
                                    <div key={s.id} className={styles.suggestionCard}>
                                        <p className={styles.suggestionContent}>{s.content}</p>
                                        <p className={styles.suggestionDate}>{formatDateTime(s.created_at)} · Anonymous</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* POST UPDATE */}
                {activeTab === 'posts' && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Post an Update</h2>
                        <p className={styles.sectionSub}>This will appear on the Main Page for all students and staff.</p>
                        <div className={styles.postEditor}>
                            <textarea
                                className={`input ${styles.postTextarea}`}
                                placeholder="Write your update here..."
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                rows={6}
                            />

                            {/* FILE UPLOAD — ADDED */}
                            <label style={{ cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) { setPostFile(f); setPostFileName(f.name) }
                                    }}
                                />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 18px',
                                    border: '1.5px dashed var(--border-input)',
                                    borderRadius: '10px',
                                    background: 'var(--bg-input)',
                                    transition: 'border-color 0.2s ease',
                                    cursor: 'pointer',
                                }}>
                                    <span style={{ fontSize: '20px' }}>📎</span>
                                    <span style={{
                                        flex: 1,
                                        fontSize: '14px',
                                        color: postFileName ? 'var(--text-primary)' : 'var(--text-muted)',
                                        wordBreak: 'break-all',
                                    }}>
                                        {postFileName || 'Attach a file (optional)'}
                                    </span>
                                    {postFileName && (
                                        <span
                                            style={{
                                                fontSize: '13px',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setPostFile(null)
                                                setPostFileName('')
                                            }}
                                        >
                                            ✕
                                        </span>
                                    )}
                                </div>
                            </label>

                            <button
                                className="btn-primary"
                                onClick={createPost}
                                disabled={postLoading || !postContent.trim()}
                            >
                                {postLoading ? 'Publishing...' : '📢 Publish Update'}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            {selectedUser.profile_picture_url ? (
                                <img src={selectedUser.profile_picture_url} alt={selectedUser.name} className={styles.modalAvatar} />
                            ) : (
                                <div className={styles.modalAvatarPlaceholder}>{selectedUser.name?.charAt(0).toUpperCase()}</div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h2 className={styles.modalName}>{selectedUser.name}</h2>
                                <p className={styles.modalEmail}>{selectedUser.email}</p>
                                <div className={styles.modalMeta}>
                                    <span className={`${styles.badge} ${selectedUser.role === 'staff' ? styles.badgeStaff : styles.badgeStudent}`}>{selectedUser.role}</span>
                                    <span className={`${styles.badge} ${selectedUser.status === 'approved' ? styles.badgeApproved : selectedUser.status === 'pending' ? styles.badgePending : styles.badgeRejected}`}>{selectedUser.status}</span>
                                    {selectedUser.instructor_code && <span className={styles.instructorCode}>🔑 {selectedUser.instructor_code}</span>}
                                </div>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSelectedUser(null)}>✕</button>
                        </div>

                        {statsLoading ? (
                            <div className={styles.modalLoading}>Loading stats...</div>
                        ) : (
                            <>
                                {userStats?.type === 'student' && (
                                    <>
                                        <div className={styles.modalStats}>
                                            <div className={styles.modalStatCard}>
                                                <div className={styles.modalStatNum}>{userStats.assignmentsSubmitted}</div>
                                                <div className={styles.modalStatLabel}>Assignments Submitted</div>
                                            </div>
                                            <div className={styles.modalStatCard}>
                                                <div className={styles.modalStatNum}>{userStats.grades.length}</div>
                                                <div className={styles.modalStatLabel}>Grades Received</div>
                                            </div>
                                        </div>
                                        {userStats.grades.length > 0 && (
                                            <div className={styles.modalSection}>
                                                <h3 className={styles.modalSectionTitle}>Grades</h3>
                                                {userStats.grades.map((g: any, i: number) => (
                                                    <div key={i} className={styles.modalRow}>
                                                        <span className={styles.modalRowLabel}>Grade</span>
                                                        <span className={styles.modalRowValue} style={{ color: 'var(--accent)' }}>{g.grade}</span>
                                                        {g.feedback && <span className={styles.modalRowSub}>{g.feedback}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                {userStats?.type === 'staff' && (
                                    <div className={styles.modalStats}>
                                        <div className={styles.modalStatCard}>
                                            <div className={styles.modalStatNum}>{userStats.assignmentsReceived}</div>
                                            <div className={styles.modalStatLabel}>Assignments Received</div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
}