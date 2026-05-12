// Returns a human-readable string of how long until Friday
// Used for the suggestion box countdown timer

export function timeUntilFriday(): string {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 5 = Friday

    // How many days until Friday
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7

    const future = new Date(now)
    future.setDate(now.getDate() + daysUntilFriday)
    future.setHours(0, 0, 0, 0)

    const diffMs = future.getTime() - now.getTime()

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`
}