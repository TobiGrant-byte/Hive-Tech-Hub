'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react'

// ============================================
// TYPES
// ============================================

type Theme = 'morning' | 'afternoon' | 'evening'

interface ThemeContextType {
    theme: Theme
    greeting: string
    greetingIcon: string
}

// ============================================
// HELPERS
// ============================================

function getThemeFromTime(): Theme {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    return 'evening'
}

function getGreeting(theme: Theme): string {
    switch (theme) {
        case 'morning': return 'Good morning'
        case 'afternoon': return 'Good afternoon'
        case 'evening': return 'Good evening'
    }
}

function getGreetingIcon(theme: Theme): string {
    switch (theme) {
        case 'morning': return '🌅'
        case 'afternoon': return '☀️'
        case 'evening': return '🌙'
    }
}

// ============================================
// CONTEXT
// ============================================

const ThemeContext = createContext<ThemeContextType>({
    theme: 'morning',
    greeting: 'Good morning',
    greetingIcon: '🌅',
})

// ============================================
// PROVIDER
// ============================================

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getThemeFromTime())

    useEffect(() => {
        // Apply theme to the root html element
        document.documentElement.setAttribute('data-theme', theme)

        // Check every minute if the theme should change
        const interval = setInterval(() => {
            const newTheme = getThemeFromTime()
            if (newTheme !== theme) {
                setTheme(newTheme)
                document.documentElement.setAttribute('data-theme', newTheme)
            }
        }, 60000)

        return () => clearInterval(interval)
    }, [theme])

    return (
        <ThemeContext.Provider
            value={{
                theme,
                greeting: getGreeting(theme),
                greetingIcon: getGreetingIcon(theme),
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

// ============================================
// HOOK — use this anywhere in the app
// ============================================

export function useTheme() {
    return useContext(ThemeContext)
}