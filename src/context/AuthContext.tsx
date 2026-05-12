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
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
    }

    const refreshProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await fetchProfile(user.id)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
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