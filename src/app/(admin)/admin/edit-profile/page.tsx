'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './edit-profile.module.css'

export default function EditProfilePage() {
    const { profile, refreshProfile } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [name, setName] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [pwLoading, setPwLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (profile) {
            setName(profile.name || '')
            setAvatarPreview(profile.profile_picture_url || null)
        }
    }, [profile])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSaveProfile = async () => {
        if (!profile) return
        if (!name.trim()) { setError('Name cannot be empty'); return }

        setLoading(true)
        setError(null)
        setSuccess(null)

        let avatarUrl = profile.profile_picture_url

        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${profile.id}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile, { upsert: true })

            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)
                avatarUrl = urlData.publicUrl
            }
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ name: name.trim(), profile_picture_url: avatarUrl })
            .eq('id', profile.id)

        if (updateError) {
            setError(updateError.message)
        } else {
            await refreshProfile()
            setSuccess('Profile updated!')
            setTimeout(() => setSuccess(null), 3000)
        }

        setLoading(false)
    }

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) { setError('Please fill in both fields'); return }
        if (newPassword !== confirmPassword)  { setError('Passwords do not match');      return }
        if (newPassword.length < 6)           { setError('Minimum 6 characters');        return }

        setPwLoading(true)
        setError(null)
        setSuccess(null)

        const { error } = await supabase.auth.updateUser({ password: newPassword })

        if (error) {
            setError(error.message)
        } else {
            setSuccess('Password updated!')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setSuccess(null), 3000)
        }

        setPwLoading(false)
    }

    const strengthLevel = newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Good' : 'Weak'
    const strengthWidth = newPassword.length >= 12 ? '100%' : newPassword.length >= 8 ? '66%' : '33%'
    const strengthColor = newPassword.length >= 12 ? '#4ade80' : newPassword.length >= 8 ? 'var(--accent)' : '#f87171'

    return (
        <div className={styles.container}>

            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <img src="/Hive logo.jpeg" alt="Hive Tech Hub" className={styles.logo} />
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}</p>
                        <h2 className={styles.adminName}>{profile?.name || 'Admin'}</h2>
                        <p className={styles.adminRole}>Administrator</p>
                    </div>
                </div>
                <button className={styles.backBtn} onClick={() => router.push('/admin')}>
                    <span>← Back to Dashboard</span>
                </button>
            </div>

            <div className={styles.content}>

                {/* Profile card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Edit Profile</h2>
                    <p className={styles.cardSub}>Update your name and profile picture.</p>

                    <div className={styles.avatarSection}>
                        <label htmlFor="avatar" className={styles.avatarLabel}>
                            {avatarPreview
                                ? <img src={avatarPreview} alt="avatar" className={styles.avatarImg} />
                                : <div className={styles.avatarPlaceholder}>
                                    <span>{profile?.name?.charAt(0).toUpperCase() || 'A'}</span>
                                </div>
                            }
                            <div className={styles.avatarOverlay}>Change</div>
                        </label>
                        <input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className={styles.hiddenInput}
                        />
                        <div>
                            <p className={styles.avatarName}>{profile?.name}</p>
                            <p className={styles.avatarEmail}>{profile?.email}</p>
                            <span className={styles.avatarBadge}>Administrator</span>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>DISPLAY NAME</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>EMAIL ADDRESS</label>
                        <input
                            className="input"
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        />
                        <p className={styles.fieldNote}>Email cannot be changed here.</p>
                    </div>

                    {error   && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}

                    <button className="btn-primary" onClick={handleSaveProfile} disabled={loading}>
                        {loading ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </div>

                {/* Password card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Change Password</h2>
                    <p className={styles.cardSub}>Update your account password.</p>

                    <div className={styles.field}>
                        <label className={styles.label}>NEW PASSWORD</label>
                        <div className={styles.pwWrap}>
                            <input
                                className="input"
                                type={showPw ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                className={styles.eyeBtn}
                                onClick={() => setShowPw(!showPw)}
                                type="button"
                            >
                                {showPw ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>CONFIRM NEW PASSWORD</label>
                        <input
                            className="input"
                            type={showPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {newPassword && (
                        <div className={styles.strengthBar}>
                            <div className={styles.strengthTrack}>
                                <div
                                    className={styles.strengthFill}
                                    style={{ width: strengthWidth, background: strengthColor }}
                                />
                            </div>
                            <span className={styles.strengthLabel}>{strengthLevel}</span>
                        </div>
                    )}

                    <button className="btn-primary" onClick={handleChangePassword} disabled={pwLoading}>
                        {pwLoading ? 'Updating...' : '🔐 Update Password'}
                    </button>
                </div>

            </div>
        </div>
    )
}