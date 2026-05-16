'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { generateInstructorCode } from '@/lib/generateInstructorCode'
import { useTheme } from '@/context/ThemeContext'
import styles from './login.module.css'

const COURSE_OPTIONS = [
    { id: 'webdev',      label: 'Web Development',  sub: 'HTML, CSS, JavaScript' },
    { id: 'hatchdev',    label: 'HatchDev',          sub: 'Back-end using Java (Springboot)' },
    { id: 'scaffolding', label: 'Scaffolding.dart',  sub: 'Mobile development with Dart (Flutter)' },
]

export default function LoginPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const { greeting, greetingIcon, theme } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [role, setRole] = useState<'student' | 'staff'>('student')
    const [signupData, setSignupData] = useState({
        name: '', email: '', password: '',
        age: '', date_of_birth: '', course: '', teaching_experience: '',
    })
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
    }

    const handleSignIn = async () => {
        if (!loginData.email || !loginData.password) { setError('Please fill in all fields'); return }
        setLoading(true); setError(null)

        console.log('Attempting sign in with:', loginData.email)

        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginData.email, password: loginData.password,
        })

        console.log('Sign in result:', { data, error })

        if (error) { setError(error.message); setLoading(false); return }

        if (data.user) {
            console.log('User found:', data.user.id)

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', data.user.id)
                .single()

            console.log('Profile result:', { profile, profileError })

            if (!profile) { setError('Profile not found.'); setLoading(false); return }

            if (profile.status === 'pending')  { window.location.href = '/awaiting'; return }
            if (profile.status === 'rejected') { setError('Your account has been rejected.'); setLoading(false); return }

            if (profile.role === 'admin')   { window.location.href = '/admin';   return }
            if (profile.role === 'staff')   { window.location.href = '/staff';   return }
            if (profile.role === 'student') { window.location.href = '/student'; return }
        }

        setLoading(false)
    }
    const handleSignUp = async () => {
        if (!signupData.name || !signupData.email || !signupData.password) {
            setError('Please fill in all required fields'); return
        }
        if (!signupData.course) { setError('Please select a course / specialization'); return }
        setLoading(true); setError(null)

        let instructorCode: string | null = null
        if (role === 'staff') instructorCode = await generateInstructorCode()

        const { data, error } = await supabase.auth.signUp({
            email: signupData.email, password: signupData.password,
            options: { data: { name: signupData.name, role } },
        })
        if (error) { setError(error.message); setLoading(false); return }
        if (!data.user) { setError('Something went wrong.'); setLoading(false); return }

        let avatarUrl: string | null = null
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${data.user.id}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('avatars').upload(fileName, avatarFile, { upsert: true })
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
                avatarUrl = urlData.publicUrl
            }
        }

        await supabase.from('profiles').update({
            age: signupData.age ? parseInt(signupData.age) : null,
            date_of_birth: signupData.date_of_birth || null,
            course: signupData.course,
            teaching_experience: role === 'staff' ? signupData.teaching_experience : null,
            profile_picture_url: avatarUrl,
            instructor_code: instructorCode,
        }).eq('id', data.user.id)

        router.push('/awaiting')
        setLoading(false)
    }

    const greetingQuote: Record<string, string> = {
        morning:   'The morning belongs to those who begin.',
        afternoon: 'The afternoon belongs to those who show up.',
        evening:   'The evening belongs to those who reflect.',
    }

    return (
        <div className={styles.container}>

            {/* ── LEFT PANEL ── */}
            <div className={styles.leftPanel}>
                <div className={styles.leftLogo}>
                    <img src="/Hive logo.jpeg" alt="Hive Tech Hub" className={styles.leftLogoImg} />
                    <span className={styles.leftLogoText}>HiveTech<span>Hub</span></span>
                </div>

                <div className={styles.leftHero}>
                    <div className={styles.leftEyebrow}>A Digital Skill Learning Platform</div>
                    <p className={styles.leftGreeting}>{greetingQuote[theme]}</p>
                    <h1 className={styles.leftHeading}>
                        Where <em>knowledge</em><br />meets<br />excellence.
                    </h1>
                    <div className={styles.leftRule} />
                    <p className={styles.leftSub}>A platform for continuous learning and growth.</p>
                    <div className={styles.leftStats}>
                        <div className={styles.leftStat}>
                            <div className={styles.leftStatNum}>12</div>
                            <div className={styles.leftStatLabel}>Week Course</div>
                        </div>
                        <div className={styles.leftStat}>
                            <div className={styles.leftStatNum}>3</div>
                            <div className={styles.leftStatLabel}>Dev Paths</div>
                        </div>
                        <div className={styles.leftStat}>
                            <div className={styles.leftStatNum}>∞</div>
                            <div className={styles.leftStatLabel}>Possibilities</div>
                        </div>
                    </div>
                </div>

                <div className={styles.leftFooter}>© 2025 HiveTechHub · All rights reserved</div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className={styles.rightPanel}>

                {/* Mobile logo — hidden on desktop */}
                <div className={styles.logoWrapper}>
                    <img src="/Hive logo.jpeg" alt="Hive Tech Hub" className={styles.logo} />
                </div>

                <div className={styles.topBar}>
                    <div className="greeting-pill">{greetingIcon} {greeting}</div>
                </div>

                <div className={styles.toggle}>
                    <button
                        className={`${styles.toggleBtn} ${mode === 'signin' ? styles.toggleActive : ''}`}
                        onClick={() => { setMode('signin'); setError(null) }}
                    >SIGN IN</button>
                    <button
                        className={`${styles.toggleBtn} ${mode === 'signup' ? styles.toggleActive : ''}`}
                        onClick={() => { setMode('signup'); setError(null) }}
                    >SIGN UP</button>
                </div>

                <div className={styles.heading}>
                    <h1>{mode === 'signin' ? 'Welcome back.' : 'Join the platform.'}</h1>
                    <p>{mode === 'signin' ? `${greeting}. Sign in to continue.` : 'Create your account to get started.'}</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* SIGN IN */}
                {mode === 'signin' && (
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>EMAIL ADDRESS</label>
                            <input className="input" type="email" placeholder="you@example.com"
                                   value={loginData.email}
                                   onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>PASSWORD</label>
                            <div className={styles.passwordWrapper}>
                                <input className="input" type={showPassword ? 'text' : 'password'}
                                       placeholder="••••••••" value={loginData.password}
                                       onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                                <button className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} type="button">
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        <div className={styles.forgotWrapper}>
                            <button className={styles.forgotBtn} onClick={() => router.push('/reset-password')} type="button">
                                Forgot your password?
                            </button>
                        </div>
                        <button className="btn-primary" onClick={handleSignIn} disabled={loading}>
                            {loading ? 'Signing in...' : 'SIGN IN'}
                        </button>
                        <div className={styles.switchMode}>
                            <span>——</span><span className={styles.switchText}>NEW TO THE PLATFORM?</span><span>——</span>
                        </div>
                    </div>
                )}

                {/* SIGN UP */}
                {mode === 'signup' && (
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>I AM A</label>
                            <div className={styles.roleToggle}>
                                <button className={`${styles.roleBtn} ${role === 'student' ? styles.roleActive : ''}`}
                                        onClick={() => setRole('student')} type="button">👨‍🎓 Student</button>
                                <button className={`${styles.roleBtn} ${role === 'staff' ? styles.roleActive : ''}`}
                                        onClick={() => setRole('staff')} type="button">👨‍🏫 Staff / Instructor</button>
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>PROFILE PICTURE</label>
                            <div className={styles.avatarUpload}>
                                <label className={styles.avatarLabel} htmlFor="avatar">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="preview" className={styles.avatarPreview} />
                                        : <div className={styles.avatarPlaceholder}>
                                            <span className={styles.avatarPlus}>+</span>
                                            <span>Upload Image</span>
                                        </div>
                                    }
                                </label>
                                <input id="avatar" type="file" accept="image/*,image/heic,image/heif"
                                       onChange={handleAvatarChange} className={styles.hiddenInput} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>FULL NAME</label>
                            <input className="input" type="text" placeholder="Your full name"
                                   value={signupData.name}
                                   onChange={(e) => setSignupData({ ...signupData, name: e.target.value })} />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>AGE</label>
                                <input className="input" type="number" placeholder="25" min="10" max="100"
                                       value={signupData.age}
                                       onChange={(e) => setSignupData({ ...signupData, age: e.target.value })} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>DATE OF BIRTH</label>
                                <input className="input" type="date" value={signupData.date_of_birth}
                                       onChange={(e) => setSignupData({ ...signupData, date_of_birth: e.target.value })} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>EMAIL ADDRESS</label>
                            <input className="input" type="email" placeholder="you@example.com"
                                   value={signupData.email}
                                   onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>PASSWORD</label>
                            <div className={styles.passwordWrapper}>
                                <input className="input" type={showPassword ? 'text' : 'password'}
                                       placeholder="••••••••" value={signupData.password}
                                       onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} />
                                <button className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} type="button">
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        {role === 'staff' && (
                            <div className={styles.field}>
                                <label className={styles.label}>TEACHING / CODING EXPERIENCE</label>
                                <textarea className={`input ${styles.textarea}`} rows={4}
                                          placeholder="Tell us about your teaching or coding experience..."
                                          value={signupData.teaching_experience}
                                          onChange={(e) => setSignupData({ ...signupData, teaching_experience: e.target.value })} />
                            </div>
                        )}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                {role === 'student' ? 'WHAT WOULD YOU LIKE TO LEARN?' : 'WHAT AREA DO YOU SPECIALISE IN?'}
                            </label>
                            <div className={styles.radioGroup}>
                                {COURSE_OPTIONS.map((option) => (
                                    <label key={option.id}
                                           className={`${styles.radioOption} ${signupData.course === option.id ? styles.radioActive : ''}`}>
                                        <input type="radio" name="course" value={option.id}
                                               checked={signupData.course === option.id}
                                               onChange={(e) => setSignupData({ ...signupData, course: e.target.value })}
                                               className={styles.hiddenRadio} />
                                        <div className={styles.radioDot} />
                                        <div className={styles.radioText}>
                                            <span className={styles.radioLabel}>{option.label}</span>
                                            <span className={styles.radioSub}>{option.sub}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button className="btn-primary" onClick={handleSignUp} disabled={loading}>
                            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
                        </button>
                        <div className={styles.switchMode}>
                            <span>——</span><span className={styles.switchText}>ALREADY HAVE AN ACCOUNT?</span><span>——</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}