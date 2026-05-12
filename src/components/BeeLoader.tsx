'use client'

interface BeeLoaderProps {
    text?: string
}

export default function BeeLoader({ text = 'Loading...' }: BeeLoaderProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
        }}>
            <style>{`
                @keyframes beeHover {
                    0%   { transform: translateY(0px) rotate(-5deg); }
                    25%  { transform: translateY(-18px) rotate(5deg); }
                    50%  { transform: translateY(-8px) rotate(-3deg); }
                    75%  { transform: translateY(-20px) rotate(6deg); }
                    100% { transform: translateY(0px) rotate(-5deg); }
                }
                @keyframes beePulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.4; }
                }
                @keyframes dotBounce {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50%      { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>

            <div style={{
                fontSize: '52px',
                animation: 'beeHover 1.6s ease-in-out infinite',
            }}>
                🐝
            </div>

            <div style={{
                fontSize: '13px',
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                animation: 'beePulse 1.6s ease-in-out infinite',
            }}>
                {text}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        animation: 'dotBounce 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
            </div>
        </div>
    )
}