'use client'

import { useState } from 'react'

interface FilePreviewProps {
    fileUrl: string
}

export default function FilePreview({ fileUrl }: FilePreviewProps) {
    const [previewing, setPreviewing] = useState(false)
    const [htmlContent, setHtmlContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const isHtml = /\.(html|htm)$/i.test(fileUrl)
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
            previewing ? setPreviewing(false) : loadHtml()
        } else if (isPdf || isImage) {
            setPreviewing(!previewing)
        } else {
            window.open(fileUrl, '_blank')
        }
    }

    const buttonLabel = loading
        ? 'Loading...'
        : isHtml
            ? previewing ? 'Hide Preview' : 'Preview HTML'
            : isPdf
                ? previewing ? 'Hide PDF' : 'View PDF'
                : isImage
                    ? previewing ? 'Hide Image' : 'View Image'
                    : 'View File'

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
                {buttonLabel}
            </button>

            {isImage && previewing && (
                <img
                    src={fileUrl}
                    alt="Attached file"
                    style={{
                        maxWidth: '100%',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                    }}
                />
            )}

            {isPdf && previewing && (
                <div style={{
                    border: '1.5px solid var(--accent)',
                    borderRadius: '12px',
                    overflow: 'hidden',
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
                        <span>PDF Preview</span>

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
                        Open in new tab
                    </a>
                </div>
                <iframe
                src={fileUrl}
             style={{
                 width: '100%',
                 height: '500px',
                 border: 'none',
                 display: 'block',
                 background: '#fff',
             }}
             title="PDF Preview"
        />
</div>
)}

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
            <span>HTML Preview</span>

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
            Open in new tab
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