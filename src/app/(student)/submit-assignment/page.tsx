'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { validateInstructorCode } from '@/utils/validateInstructorCode'
import BeeLoader from '@/components/BeeLoader'
import styles from './submit-assignment.module.css'

export default function SubmitAssignmentPage() {
    const { profile, loading: authLoading, signOut } = useAuth()
    const { greeting, greetingIcon } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    const [instructorCode, setInstructorCode] = useState('')
    const [contentText, setContentText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [fileName, setFileName] = useState('')
    const [codeValid, setCodeValid] = useState<boolean | null>(null)
    const [codeChecking, setCodeChecking] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return
        if (!profile) { router.replace('/login'); return }
        if (profile.role !== 'student') { router.replace('/login'); return }
    }, [authLoading, profile, router])

    const checkCode = async () => {
        if (!instructorCode.trim()) return
        setCodeChecking(true)
        setCodeValid(null)
        const valid = await validateInstructorCode(instructorCode.trim().toUpperCase())
        setCodeValid(valid)
        setCodeChecking(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) { setFile(f); setFileName(f.name) }
    }

    const handleSubmit = async () => {
        if (!profile) return
        if (!instructorCode.trim()) { setError('Please enter an instructor code'); return }
        if (!codeValid) { setError('Please verify a valid instructor code first'); return }
        if (!contentText.trim() && !file) { setError('Please add a description or attach a file'); return }

        setSubmitting(true)
        setError(null)

        let fileUrl: string | null = null

        if (file) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('assignments')
                .upload(fileName, file, { upsert: true })

            if (uploadError) {
                setError('File upload failed: ' + uploadError.message)
                setSubmitting(false)
                return
            }

            const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(fileName)
            fileUrl = urlData.publicUrl
        }

        const { error: insertError } = await supabase.from('assignments').insert({
            student_id: profile.id,
            student_name: profile.name,
            instructor_code: instructorCode.trim().toUpperCase(),
            content_text: contentText.trim() || null,
            file_url: fileUrl,
        })

        if (insertError) {
            setError(insertError.message)
            setSubmitting(false)
            return
        }

        setSuccess(true)
        setSubmitting(false)
    }

    if (authLoading) return <BeeLoader text="Loading..." />
    if (!profile) return null

    if (success) {
        return (
            <div className={styles.successScreen}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h1 className={styles.successTitle}>Assignment Submitted!</h1>
                    <p className={styles.successSub}>
                        Your work has been sent to your instructor. You&#39;ll be notified when it&#39;s graded.
                    </p>
                    <div className={styles.successBtns}>
                        <button className="btn-primary" onClick={() => router.push('/student')}>
                            Back to Dashboard
                        </button>
                        <button className={styles.submitAnotherBtn} onClick={() => {
                            setSuccess(false)
                            setInstructorCode('')
                            setContentText('')
                            setFile(null)
                            setFileName('')
                            setCodeValid(null)
                        }}>
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topLeft}>
                    <img src="/Hive%20logo.jpeg" alt="Hive Tech Hub" className={styles.logo} />
                    <div>
                        <p className={styles.welcomeText}>{greetingIcon} {greeting}, {profile.name}!</p>
                        <p className={styles.roleText}>👨‍🎓 Student</p>
                    </div>
                </div>
                <div className={styles.topRight}>
                    <button className={styles.navBtn} onClick={() => router.push('/student')}>
                        ← My Dashboard
                    </button>
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                </div>
            </div>

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>📤 Submit Assignment</h1>
                <p className={styles.pageSub}>Send your work directly to your instructor using their code.</p>
            </div>

            {/* Form Card */}
            <div className={styles.card}>

                {/* Step 1 — Instructor Code */}
                <div className={styles.step}>
                    <div className={styles.stepNum}>1</div>
                    <div className={styles.stepBody}>
                        <h3 className={styles.stepTitle}>Enter Instructor Code</h3>
                        <p className={styles.stepSub}>Ask your instructor for their INST-XXXX code.</p>
                        <div className={styles.codeRow}>
                            <input
                                className={`input ${styles.codeInput}`}
                                placeholder="e.g. INST-4821"
                                value={instructorCode}
                                onChange={(e) => {
                                    setInstructorCode(e.target.value.toUpperCase())
                                    setCodeValid(null)
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') checkCode() }}
                            />
                            <button
                                className={styles.verifyBtn}
                                onClick={checkCode}
                                disabled={codeChecking || !instructorCode.trim()}
                            >
                                {codeChecking ? '...' : 'Verify'}
                            </button>
                        </div>
                        {codeValid === true && (
                            <p className={styles.codeSuccess}>✅ Instructor found!</p>
                        )}
                        {codeValid === false && (
                            <p className={styles.codeError}>❌ No instructor found with this code.</p>
                        )}
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Step 2 — Assignment Content */}
                <div className={styles.step}>
                    <div className={styles.stepNum}>2</div>
                    <div className={styles.stepBody}>
                        <h3 className={styles.stepTitle}>Your Assignment</h3>
                        <p className={styles.stepSub}>Write a description and/or attach a file.</p>

                        <div className={styles.field}>
                            <label className={styles.label}>DESCRIPTION / NOTES</label>
                            <textarea
                                className={`input ${styles.textarea}`}
                                placeholder="Describe your work, add notes, or paste a link..."
                                value={contentText}
                                onChange={(e) => setContentText(e.target.value)}
                                rows={5}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>ATTACH FILE (optional)</label>
                            <label className={styles.fileLabel}>
                                <input
                                    type="file"
                                    className={styles.hiddenInput}
                                    onChange={handleFileChange}
                                />
                                <div className={styles.fileDrop}>
                                    <span className={styles.fileIcon}>📎</span>
                                    <span className={styles.fileText}>
                                        {fileName || 'Click to attach a file'}
                                    </span>
                                    {fileName && (
                                        <span className={styles.fileClear}
                                              onClick={(e) => {
                                                  e.preventDefault()
                                                  setFile(null)
                                                  setFileName('')
                                              }}>
                                            ✕
                                        </span>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Step 3 — Submit */}
                <div className={styles.step}>
                    <div className={styles.stepNum}>3</div>
                    <div className={styles.stepBody}>
                        <h3 className={styles.stepTitle}>Submit</h3>
                        <p className={styles.stepSub}>Review and send your assignment.</p>

                        {error && <div className={styles.error}>{error}</div>}

                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting || !codeValid}
                        >
                            {submitting ? '📤 Submitting...' : '📤 Submit Assignment'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}