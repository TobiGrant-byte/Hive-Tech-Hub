import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hive Tech Hub',
  description: 'Learning Management System',
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
      <body>

      {/* Bee 1 — flies left to right */}
      <svg
          className="bee-float"
          width="140"
          height="100"
          viewBox="0 0 140 100"
          xmlns="http://www.w3.org/2000/svg"
      >
          {/* Wings */}
          <ellipse cx="38" cy="35" rx="28" ry="14"
                   fill="#D4A017" opacity="0.7"
                   transform="rotate(-25 38 35)"/>
          <ellipse cx="102" cy="35" rx="28" ry="14"
                   fill="#D4A017" opacity="0.7"
                   transform="rotate(25 102 35)"/>
          <ellipse cx="34" cy="50" rx="20" ry="10"
                   fill="#D4A017" opacity="0.4"
                   transform="rotate(-10 34 50)"/>
          <ellipse cx="106" cy="50" rx="20" ry="10"
                   fill="#D4A017" opacity="0.4"
                   transform="rotate(10 106 50)"/>
          {/* Body */}
          <ellipse cx="70" cy="55" rx="16" ry="28" fill="#D4A017"/>
          <ellipse cx="70" cy="46" rx="13" ry="9" fill="#1A1200"/>
          <ellipse cx="70" cy="58" rx="13" ry="9" fill="#1A1200"/>
          <ellipse cx="70" cy="70" rx="10" ry="8" fill="#D4A017"/>
          {/* Head */}
          <circle cx="70" cy="28" r="10" fill="#D4A017"/>
          {/* Eyes */}
          <circle cx="65" cy="26" r="2.5" fill="#1A1200"/>
          <circle cx="75" cy="26" r="2.5" fill="#1A1200"/>
          {/* Antennae */}
          <line x1="64" y1="19" x2="52" y2="6"
                stroke="#D4A017" strokeWidth="2.5"
                strokeLinecap="round"/>
          <circle cx="51" cy="5" r="3.5" fill="#D4A017"/>
          <line x1="76" y1="19" x2="88" y2="6"
                stroke="#D4A017" strokeWidth="2.5"
                strokeLinecap="round"/>
          <circle cx="89" cy="5" r="3.5" fill="#D4A017"/>
          {/* Circuit lines on wings */}
          <line x1="20" y1="33" x2="50" y2="33"
                stroke="#1A1200" strokeWidth="1.2" opacity="0.6"/>
          <line x1="32" y1="26" x2="32" y2="40"
                stroke="#1A1200" strokeWidth="1.2" opacity="0.6"/>
          <circle cx="20" cy="33" r="2" fill="#1A1200" opacity="0.6"/>
          <line x1="90" y1="33" x2="120" y2="33"
                stroke="#1A1200" strokeWidth="1.2" opacity="0.6"/>
          <line x1="108" y1="26" x2="108" y2="40"
                stroke="#1A1200" strokeWidth="1.2" opacity="0.6"/>
          <circle cx="120" cy="33" r="2" fill="#1A1200" opacity="0.6"/>
          {/* Dotted trail */}
          <circle cx="-10" cy="55" r="3" fill="#D4A017" opacity="0.5"/>
          <circle cx="-25" cy="60" r="2" fill="#D4A017" opacity="0.35"/>
          <circle cx="-40" cy="52" r="1.5" fill="#D4A017" opacity="0.2"/>
          <circle cx="-55" cy="58" r="1" fill="#D4A017" opacity="0.1"/>
      </svg>

      {/* Bee 2 — flies right to left, smaller */}
      <svg
          className="bee-float-2"
          width="90"
          height="65"
          viewBox="0 0 140 100"
          xmlns="http://www.w3.org/2000/svg"
      >
          <ellipse cx="38" cy="35" rx="28" ry="14"
                   fill="#D4A017" opacity="0.7"
                   transform="rotate(-25 38 35)"/>
          <ellipse cx="102" cy="35" rx="28" ry="14"
                   fill="#D4A017" opacity="0.7"
                   transform="rotate(25 102 35)"/>
          <ellipse cx="70" cy="55" rx="16" ry="28" fill="#D4A017"/>
          <ellipse cx="70" cy="46" rx="13" ry="9" fill="#1A1200"/>
          <ellipse cx="70" cy="58" rx="13" ry="9" fill="#1A1200"/>
          <circle cx="70" cy="28" r="10" fill="#D4A017"/>
          <circle cx="65" cy="26" r="2.5" fill="#1A1200"/>
          <circle cx="75" cy="26" r="2.5" fill="#1A1200"/>
          <line x1="64" y1="19" x2="52" y2="6"
                stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="51" cy="5" r="3.5" fill="#D4A017"/>
          <line x1="76" y1="19" x2="88" y2="6"
                stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="89" cy="5" r="3.5" fill="#D4A017"/>
          {/* Dotted trail opposite direction */}
          <circle cx="150" cy="55" r="3" fill="#D4A017" opacity="0.5"/>
          <circle cx="165" cy="48" r="2" fill="#D4A017" opacity="0.35"/>
          <circle cx="180" cy="55" r="1.5" fill="#D4A017" opacity="0.2"/>
      </svg>
      {/* Trail dots for bee 1 */}
      <div className="trail-dot trail-dot-1" />
      <div className="trail-dot trail-dot-2" />
      <div className="trail-dot trail-dot-3" />
      <div className="trail-dot trail-dot-4" />
      <div className="trail-dot trail-dot-5" />

      {/* Trail dots for bee 2 */}
      <div className="trail-dot-b trail-dot-b1" />
      <div className="trail-dot-b trail-dot-b2" />
      <div className="trail-dot-b trail-dot-b3" />

      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
      </body>
      </html>
  )
}