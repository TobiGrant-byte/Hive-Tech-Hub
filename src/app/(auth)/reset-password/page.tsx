'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useTheme } from '@/context/ThemeContext'
import styles from './reset-password.module.css'

type Mode = 'request' | 'update'

export default function ResetPasswordPage() {
    const [mode, setMode] = useState<Mode>('request')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    // If user came from reset email link
    // Supabase puts them in a session automatically
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // They clicked the email link — show update password form
                setMode('update')
            }
        }
        checkSession()

        // Listen for auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setMode('update')
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // ============================================
    // REQUEST RESET EMAIL
    // ============================================
    const handleRequest = async () => {
        if (!email) {
            setError('Please enter your email')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Check your email for a password reset link!')
        }

        setLoading(false)
    }

    // ============================================
    // UPDATE PASSWORD
    // ============================================
    const handleUpdate = async () => {
        if (!password || !confirmPassword) {
            setError('Please fill in both fields')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Password updated successfully!')
            setTimeout(() => router.push('/login'), 2000)
        }

        setLoading(false)
    }

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

            <div className={styles.card}>

                <h1 className={styles.title}>
                    {mode === 'request' ? 'Reset Password' : 'Set New Password'}
                </h1>

                <p className={styles.subtitle}>
                    {mode === 'request'
                        ? 'Enter your email and we\'ll send you a reset link.'
                        : 'Enter your new password below.'}
                </p>

                {/* Error */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Success */}
                {message && <div className={styles.success}>{message}</div>}

                {/* Request Form */}
                {mode === 'request' && !message && (
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>EMAIL ADDRESS</label>
                            <input
                                className="input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleRequest}
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <button
                            className={styles.backBtn}
                            onClick={() => router.push('/login')}
                        >
                            ← Back to Sign In
                        </button>
                    </div>
                )}

                {/* Update Password Form */}
                {mode === 'update' && !message && (
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>NEW PASSWORD</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    className="input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    type="button"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>CONFIRM PASSWORD</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    className="input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}