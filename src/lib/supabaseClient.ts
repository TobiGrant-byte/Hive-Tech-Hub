import { createBrowserClient } from '@supabase/ssr'

// This instance is used in all client components
// (anything with 'use client' at the top)

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}