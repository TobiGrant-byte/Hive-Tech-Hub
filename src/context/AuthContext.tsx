'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { Profile } from '@/types'

interface AuthContextType {
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    profile: null,
    loading: true,
    signOut: async () => {},
    refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            setProfile(data)
        } catch {
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }

    const refreshProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) await fetchProfile(user.id)
        } catch {
            setLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true

        // Safety timeout — if auth takes more than 5 seconds stop loading
        const timeout = setTimeout(() => {
            if (mounted) setLoading(false)
        }, 5000)

        const init = async () => {
            try {
                // Try getSession first — fastest, reads from cookie
                const { data: { session } } = await supabase.auth.getSession()

                if (!mounted) return

                if (session?.user) {
                    clearTimeout(timeout)
                    await fetchProfile(session.user.id)
                } else {
                    // Fallback to getUser — verifies with server
                    const { data: { user } } = await supabase.auth.getUser()

                    if (!mounted) return

                    if (user) {
                        clearTimeout(timeout)
                        await fetchProfile(user.id)
                    } else {
                        clearTimeout(timeout)
                        setLoading(false)
                    }
                }
            } catch {
                if (mounted) setLoading(false)
                clearTimeout(timeout)
            }
        }

        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return
                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}