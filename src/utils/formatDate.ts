// Formats a date string into readable format
// e.g. "2024-01-15T10:30:00" → "Jan 15, 2024"

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// Formats a date string with time
// e.g. "2024-01-15T10:30:00" → "Jan 15, 2024 at 10:30 AM"

export function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Formats just the time
// e.g. "2024-01-15T10:30:00" → "10:30 AM"

export function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    })
}