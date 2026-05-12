'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function usePreventBack(redirectTo: string) {
    const router = useRouter()

    useEffect(() => {
        // Push current state so back button has somewhere to go
        window.history.pushState(null, '', window.location.href)

        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href)
            router.replace(redirectTo)
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [redirectTo, router])
}