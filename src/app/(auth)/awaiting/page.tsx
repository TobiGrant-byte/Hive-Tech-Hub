'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTheme } from '@/context/ThemeContext'
import styles from './awaiting.module.css'

export default function AwaitingPage() {
    const router = useRouter()
    const supabase = createClient()
    const { greeting, greetingIcon } = useTheme()

    useEffect(() => {
        const channelRef = { current: null as ReturnType<typeof supabase.channel> | null }
        let mounted = true

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!mounted) return

            if (!user) {
                router.push('/login')
                return
            }

            // Check current status first
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', user.id)
                .maybeSingle()

            if (!mounted) return

            if (profile?.status === 'approved') {
                if (profile.role === 'staff') router.push('/staff')
                else if (profile.role === 'admin') router.push('/admin')
                else router.push('/student')
                return
            }

            if (profile?.status === 'rejected') {
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            // Remove any existing channel first
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }

            // Create fresh channel
            const channel = supabase.channel(`profile-status-${user.id}-${Date.now()}`)

            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    if (!mounted) return
                    const { status, role } = payload.new

                    if (status === 'approved') {
                        if (role === 'staff') router.push('/staff')
                        else if (role === 'admin') router.push('/admin')
                        else router.push('/student')
                    }

                    if (status === 'rejected') {
                        supabase.auth.signOut()
                        router.push('/login')
                    }
                }
            )

            channel.subscribe()
            channelRef.current = channel
        }

        init()

        return () => {
            mounted = false
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [])

    return (
        <div className={styles.container}>

            {/* Greeting Pill */}
            <div className={styles.topBar}>
                <div className="greeting-pill">
                    {greetingIcon} {greeting}
                </div>
            </div>

            {/* Logo */}
            <div className={styles.logoWrapper}>
                <img
                    src="/Hive%20logo.jpeg"
                    alt="Hive Tech Hub"
                    className={styles.logo}
                />
            </div>

            {/* Content */}
            <div className={styles.card}>

                {/* Animated bee icon */}
                <div className={styles.beeIcon}>🐝</div>

                <h1 className={styles.title}>Application Received</h1>

                <p className={styles.message}>
                    Your application is currently under review. Our admins will
                    assess your profile and get back to you shortly.
                </p>

                <div className={styles.divider} />

                <p className={styles.sub}>
                    This page will automatically redirect you the moment your
                    account is approved — no need to refresh.
                </p>

                {/* Pulsing status indicator */}
                <div className={styles.statusRow}>
                    <div className={styles.pulsingDot} />
                    <span className={styles.statusText}>Waiting for approval</span>
                </div>

            </div>

            {/* Sign out */}
            <button
                className={styles.signOutBtn}
                onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                }}
            >
                Sign out and go back
            </button>

        </div>
    )
}