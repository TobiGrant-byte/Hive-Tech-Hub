'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { formatDateTime } from '@/utils/formatDate'
import { isFriday } from '@/utils/isFriday'
import { timeUntilFriday } from '@/utils/timeUntilFriday'
import type { Reaction } from '@/types'
import styles from './main.module.css'
import FilePreview from '@/components/FilePreview'

export default function MainPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
    const [suggestionOpen, setSuggestionOpen] = useState(false)
    const [suggestionText, setSuggestionText] = useState('')
    const [suggestionSent, setSuggestionSent] = useState(false)
    const [timeLeft, setTimeLeft] = useState(timeUntilFriday())
    const friday = isFriday()

    // Wait for auth before doing anything
    useEffect(() => {
        if (authLoading) return

        if (!profile) {
            const timer = setTimeout(() => {
                router.replace('/login')
            }, 1500)
            return () => clearTimeout(timer)
        }

        fetchPosts()

        const channel = supabase
            .channel('main-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchPosts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, fetchPosts)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, profile])

    useEffect(() => {
        if (friday) return
        const interval = setInterval(() => {
            setTimeLeft(timeUntilFriday())
        }, 60000)
        return () => clearInterval(interval)
    }, [friday])

    const fetchPosts = async () => {
        const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (!postsData) { setLoading(false); return }

        const postsWithDetails = await Promise.all(
            postsData.map(async (post) => {
                const [{ data: comments }, { data: reactions }, { data: author }] =
                    await Promise.all([
                        supabase.from('comments').select('*').eq('post_id', post.id).order('created_at'),
                        supabase.from('reactions').select('*').eq('post_id', post.id),
                        supabase.from('profiles').select('name, profile_picture_url').eq('id', post.author_id).single(),
                    ])

                const commentsWithAuthors = await Promise.all(
                    (comments || []).map(async (comment) => {
                        const { data: commentAuthor } = await supabase
                            .from('profiles')
                            .select('name, profile_picture_url')
                            .eq('id', comment.user_id)
                            .single()
                        return {
                            ...comment,
                            author_name: commentAuthor?.name || 'Unknown',
                            author_picture_url: commentAuthor?.profile_picture_url || null,
                        }
                    })
                )

                return {
                    ...post,
                    author_name: author?.name || 'Admin',
                    author_picture_url: author?.profile_picture_url || null,
                    comments: commentsWithAuthors,
                    reactions: reactions || [],
                }
            })
        )

        setPosts(postsWithDetails)
        setLoading(false)
    }

    const handleReaction = async (postId: string, emoji: string) => {
        if (!profile) return
        const existing = posts
            .find(p => p.id === postId)
            ?.reactions.find((r: Reaction) => r.user_id === profile.id && r.emoji === emoji)

        if (existing) {
            await supabase.from('reactions').delete().eq('id', existing.id)
        } else {
            await supabase.from('reactions').insert({ post_id: postId, user_id: profile.id, emoji })
        }
        fetchPosts()
    }

    const handleComment = async (postId: string) => {
        const content = commentInputs[postId]?.trim()
        if (!content || !profile) return
        await supabase.from('comments').insert({ post_id: postId, user_id: profile.id, content })
        setCommentInputs(prev => ({ ...prev, [postId]: '' }))
        fetchPosts()
    }

    const handleSuggestion = async () => {
        if (!suggestionText.trim()) return
        await supabase.from('suggestions').insert({ content: suggestionText.trim() })
        setSuggestionText('')
        setSuggestionSent(true)
        setTimeout(() => {
            setSuggestionOpen(false)
            setSuggestionSent(false)
        }, 3000)
    }

    const getEmojiCount = (reactions: Reaction[], emoji: string) =>
        reactions.filter(r => r.emoji === emoji).length

    const hasReacted = (reactions: Reaction[], emoji: string) =>
        reactions.some(r => r.user_id === profile?.id && r.emoji === emoji)

    const EMOJIS = ['👍', '❤️', '🔥', '😮', '🎉']

    // Animated bee loader
    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                gap: '16px',
            }}>
                <style>{`
                    @keyframes beeHover {
                        0%   { transform: translateY(0px) rotate(-5deg); }
                        25%  { transform: translateY(-18px) rotate(5deg); }
                        50%  { transform: translateY(-8px) rotate(-3deg); }
                        75%  { transform: translateY(-20px) rotate(6deg); }
                        100% { transform: translateY(0px) rotate(-5deg); }
                    }
                    @keyframes beePulse {
                        0%, 100% { opacity: 1; }
                        50%      { opacity: 0.4; }
                    }
                    @keyframes dotBounce {
                        0%, 100% { transform: translateY(0); opacity: 0.4; }
                        50%      { transform: translateY(-6px); opacity: 1; }
                    }
                `}</style>
                <div style={{ fontSize: '52px', animation: 'beeHover 1.6s ease-in-out infinite' }}>
                    🐝
                </div>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    animation: 'beePulse 1.6s ease-in-out infinite',
                }}>
                    Loading...
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: '7px', height: '7px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            animation: `dotBounce 1.2s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                        }} />
                    ))}
                </div>
            </div>
        )
    }

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
                    {profile.role === 'admin' && (
                        <button className={styles.navBtn} onClick={() => router.push('/admin')}>
                            Dashboard
                        </button>
                    )}
                    {profile.role === 'staff' && (
                        <button className={styles.navBtn} onClick={() => router.push('/staff')}>
                            My Workspace
                        </button>
                    )}
                    {profile.role === 'student' && (
                        <button className={styles.navBtn} onClick={() => router.push('/student')}>
                            My Page
                        </button>
                    )}
                    <button className={styles.navBtn} onClick={() => router.push('/instructors')}>
                        Instructors
                    </button>
                    <button className={styles.signOutBtn} onClick={signOut}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* Suggestion Box */}
            <div className={styles.suggestionWrapper}>
                {friday ? (
                    <div className={styles.suggestionContainer}>
                        <button
                            className={styles.suggestionTrigger}
                            onClick={() => setSuggestionOpen(!suggestionOpen)}
                        >
                            <span>💬</span>
                            <span>Suggestion Box</span>
                            <span className={styles.suggestionBadge}>Open today!</span>
                            <span>{suggestionOpen ? '▲' : '▼'}</span>
                        </button>
                        {suggestionOpen && (
                            <div className={styles.suggestionPanel}>
                                {suggestionSent ? (
                                    <div className={styles.suggestionSuccess}>
                                        <span>✅</span>
                                        <p>Your suggestion has been sent anonymously!</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className={styles.suggestionNote}>
                                            Your suggestion is completely anonymous.
                                        </p>
                                        <textarea
                                            className={`input ${styles.suggestionInput}`}
                                            placeholder="Share your thoughts, ideas, or feedback..."
                                            value={suggestionText}
                                            onChange={(e) => setSuggestionText(e.target.value)}
                                            rows={3}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={handleSuggestion}
                                            disabled={!suggestionText.trim()}
                                        >
                                            Submit Anonymously
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.suggestionClosed}>
                        <span>💬</span>
                        <span>Suggestion Box opens in</span>
                        <span className={styles.countdown}>{timeLeft}</span>
                    </div>
                )}
            </div>

            {/* Posts Feed */}
            <div className={styles.feed}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '60px 20px',
                    }}>
                        <style>{`
                            @keyframes beeHover {
                                0%   { transform: translateY(0px) rotate(-5deg); }
                                25%  { transform: translateY(-18px) rotate(5deg); }
                                50%  { transform: translateY(-8px) rotate(-3deg); }
                                75%  { transform: translateY(-20px) rotate(6deg); }
                                100% { transform: translateY(0px) rotate(-5deg); }
                            }
                            @keyframes beePulse {
                                0%, 100% { opacity: 1; }
                                50%      { opacity: 0.4; }
                            }
                            @keyframes dotBounce {
                                0%, 100% { transform: translateY(0); opacity: 0.4; }
                                50%      { transform: translateY(-6px); opacity: 1; }
                            }
                        `}</style>
                        <div style={{ fontSize: '48px', animation: 'beeHover 1.6s ease-in-out infinite' }}>
                            🐝
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: 'var(--accent)',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            animation: 'beePulse 1.6s ease-in-out infinite',
                        }}>
                            Loading posts...
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: '7px', height: '7px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    animation: 'dotBounce 1.2s ease-in-out infinite',
                                    animationDelay: `${i * 0.2}s`,
                                }} />
                            ))}
                        </div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>📭</span>
                        <p>No updates yet. Check back soon!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className={styles.postCard}>

                            <div className={styles.postHeader}>
                                {post.author_picture_url ? (
                                    <img
                                        src={post.author_picture_url}
                                        alt={post.author_name}
                                        className={styles.postAvatar}
                                    />
                                ) : (
                                    <div className={styles.postAvatarPlaceholder}>
                                        {post.author_name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className={styles.postAuthor}>{post.author_name}</p>
                                    <p className={styles.postDate}>{formatDateTime(post.created_at)}</p>
                                </div>
                                <div className={styles.adminBadge}>📢 Update</div>
                            </div>

                            <p className={styles.postContent}>{post.content}</p>

                            {post.file_url && (
                                <FilePreview fileUrl={post.file_url} />
                            )}

                            <div className={styles.reactionsRow}>
                                {EMOJIS.map((emoji) => {
                                    const count = getEmojiCount(post.reactions, emoji)
                                    const reacted = hasReacted(post.reactions, emoji)
                                    return (
                                        <button
                                            key={emoji}
                                            className={`${styles.reactionBtn} ${reacted ? styles.reactionActive : ''}`}
                                            onClick={() => handleReaction(post.id, emoji)}
                                        >
                                            {emoji} {count > 0 && <span>{count}</span>}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                className={styles.commentsToggle}
                                onClick={() =>
                                    setExpandedComments(prev => ({
                                        ...prev,
                                        [post.id]: !prev[post.id],
                                    }))
                                }
                            >
                                💬 {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
                                {expandedComments[post.id] ? ' ▲' : ' ▼'}
                            </button>

                            {expandedComments[post.id] && (
                                <div className={styles.commentsSection}>
                                    {post.comments.map((comment: any) => (
                                        <div key={comment.id} className={styles.comment}>
                                            {comment.author_picture_url ? (
                                                <img
                                                    src={comment.author_picture_url}
                                                    alt={comment.author_name}
                                                    className={styles.commentAvatar}
                                                />
                                            ) : (
                                                <div className={styles.commentAvatarPlaceholder}>
                                                    {comment.author_name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className={styles.commentBody}>
                                                <p className={styles.commentAuthor}>{comment.author_name}</p>
                                                <p className={styles.commentContent}>{comment.content}</p>
                                                <p className={styles.commentDate}>{formatDateTime(comment.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className={styles.addComment}>
                                        {profile.profile_picture_url ? (
                                            <img
                                                src={profile.profile_picture_url}
                                                alt={profile.name}
                                                className={styles.commentAvatar}
                                            />
                                        ) : (
                                            <div className={styles.commentAvatarPlaceholder}>
                                                {profile.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className={styles.commentInputWrapper}>
                                            <input
                                                className={`input ${styles.commentInput}`}
                                                placeholder="Write a comment..."
                                                value={commentInputs[post.id] || ''}
                                                onChange={(e) =>
                                                    setCommentInputs(prev => ({
                                                        ...prev,
                                                        [post.id]: e.target.value,
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleComment(post.id)
                                                }}
                                            />
                                            <button
                                                className={styles.sendBtn}
                                                onClick={() => handleComment(post.id)}
                                                disabled={!commentInputs[post.id]?.trim()}
                                            >
                                                ➤
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}