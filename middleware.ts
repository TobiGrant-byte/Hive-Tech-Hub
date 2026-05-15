import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { pathname } = request.nextUrl

    // Skip middleware for static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return supabaseResponse
    }

    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/awaiting') ||
        pathname.startsWith('/reset-password')

    // Shared routes — any approved user can access
    const isSharedRoute =
        pathname.startsWith('/main') ||
        pathname.startsWith('/instructors')

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    // Not logged in
    if (!user) {
        if (isPublicRoute) return supabaseResponse
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Always allow awaiting page for logged in users
    if (pathname.startsWith('/awaiting')) {
        return supabaseResponse
    }

    // Get role and status from profiles table — single source of truth
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

    // No profile yet — send to awaiting
    if (!profile) {
        return NextResponse.redirect(new URL('/awaiting', request.url))
    }

    // Pending — send to awaiting
    if (profile.status === 'pending') {
        if (pathname.startsWith('/awaiting')) return supabaseResponse
        return NextResponse.redirect(new URL('/awaiting', request.url))
    }

    // Rejected — sign out and send to login
    if (profile.status === 'rejected') {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Approved — redirect away from public routes
    if (isPublicRoute) {
        if (profile.role === 'admin')   return NextResponse.redirect(new URL('/admin',   request.url))
        if (profile.role === 'staff')   return NextResponse.redirect(new URL('/staff',   request.url))
        if (profile.role === 'student') return NextResponse.redirect(new URL('/student', request.url))
    }

    // Shared routes — any approved user can access, no role check needed
    if (isSharedRoute) {
        return supabaseResponse
    }

    // Role protection
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${profile.role}`, request.url))
    }

    if (
        (pathname.startsWith('/staff') || pathname.startsWith('/assignment-landing')) &&
        profile.role !== 'staff' && profile.role !== 'admin'
    ) {
        return NextResponse.redirect(new URL(`/${profile.role}`, request.url))
    }

    if (
        (pathname.startsWith('/student') ||
            pathname.startsWith('/submit-assignment') ||
            pathname.startsWith('/view-grades')) &&
        profile.role !== 'student'
    ) {
        return NextResponse.redirect(new URL(`/${profile.role}`, request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}