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

    // ============================================
    // SKIP MIDDLEWARE FOR STATIC FILES
    // ============================================
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return supabaseResponse
    }

    // ============================================
    // PUBLIC ROUTES
    // ============================================
    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/awaiting') ||
        pathname.startsWith('/reset-password')

    // ============================================
    // GET SESSION — fast, uses cookie not DB
    // ============================================
    // GET USER — verifies with server, more secure than getSession
    const { data: { user } } = await supabase.auth.getUser()
    const session = user ? { user } : null

    // Not logged in
    if (!session) {
        if (isPublicRoute) return supabaseResponse
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Awaiting page — always allow logged in users
    if (pathname.startsWith('/awaiting')) {
        return supabaseResponse
    }

    // ============================================
    // GET ROLE FROM SESSION METADATA FIRST
    // (avoids DB call in most cases)
    // ============================================
    const role = session.user.user_metadata?.role as string | undefined

    // If we have role in metadata use it — no DB call needed
    if (role) {
        // Redirect approved users away from auth pages
        if (isPublicRoute) {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
            if (role === 'staff') return NextResponse.redirect(new URL('/staff', request.url))
            return NextResponse.redirect(new URL('/student', request.url))
        }

        // Role protection
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }
        if (
            (pathname.startsWith('/staff') || pathname.startsWith('/assignment-landing')) &&
            role !== 'staff'
        ) {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }
        if (
            (pathname.startsWith('/student') ||
                pathname.startsWith('/submit-assignment') ||
                pathname.startsWith('/view-grades')) &&
            role !== 'student'
        ) {
            return NextResponse.redirect(new URL(`/${role}`, request.url))
        }

        return supabaseResponse
    }

    // ============================================
    // FALLBACK — check DB only if no metadata
    // ============================================
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .single()

    if (!profile) {
        return NextResponse.redirect(new URL('/awaiting', request.url))
    }

    if (profile.status === 'pending') {
        return NextResponse.redirect(new URL('/awaiting', request.url))
    }

    if (profile.status === 'rejected') {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isPublicRoute) {
        if (profile.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
        if (profile.role === 'staff') return NextResponse.redirect(new URL('/staff', request.url))
        return NextResponse.redirect(new URL('/student', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}