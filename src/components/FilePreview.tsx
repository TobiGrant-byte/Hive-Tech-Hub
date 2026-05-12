'use client'

import { useState } from 'react'

interface FilePreviewProps {
    fileUrl: string
}

export default function FilePreview({ fileUrl }: FilePreviewProps) {
    const [previewing, setPreviewing] = useState(false)
    const [htmlContent, setHtmlContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const isHtml = fileUrl.toLowerCase().includes('.html') || fileUrl.toLowerCase().includes('.htm')
    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileUrl)
    const isPdf = /\.pdf$/i.test(fileUrl)

    const loadHtml = async () => {
        setLoading(true)
        try {
            const res = await fetch(fileUrl)
            const text = await res.text()
            setHtmlContent(text)
            setPreviewing(true)
        } catch {
            window.open(fileUrl, '_blank')
        }
        setLoading(false)
    }

    const handleClick = () => {
        if (isHtml) {
            if (previewing) {
                setPreviewing(false)
            } else {
                loadHtml()
            }
        } else {
            window.open(fileUrl, '_blank')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <button
                onClick={handleClick}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    border: '1.5px solid var(--accent)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'all 0.2s ease',
                }}
            >
                {loading ? '⏳ Loading...' :
                    isHtml ? (previewing ? '🙈 Hide Preview' : '🌐 Preview HTML') :
                        isImage ? '🖼️ View Image' :
                            isPdf ? '📄 View PDF' :
                                '📎 View File'}
            </button>

            {/* Image inline preview */}
            {isImage && (
                <img
                    src={fileUrl}
                    alt="Submitted file"
                    style={{
                        maxWidth: '100%',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                    }}
                />
            )}

            {/* HTML sandboxed preview */}
            {isHtml && previewing && htmlContent && (
                <div style={{
                    border: '1.5px solid var(--accent)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#fff',
                }}>
                    <div style={{
                        padding: '8px 14px',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <span>🌐</span>
                        <span>HTML Preview — sandboxed</span>

                        <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                        marginLeft: 'auto',
                        color: 'var(--accent)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                        >
                        Open in new tab ↗
                    </a>
                </div>
                <iframe
                srcDoc={htmlContent}
             sandbox="allow-scripts"
             style={{
                 width: '100%',
                 height: '400px',
                 border: 'none',
                 display: 'block',
             }}
             title="HTML Preview"
        />
</div>
)}
</div>
)
}