import { createClient } from '@/lib/supabaseClient'

// Checks if an instructor code actually exists in the database
// Used on the Assignment Submission page before allowing a send

export async function validateInstructorCode(code: string): Promise<boolean> {
    const supabase = createClient()

    const { data } = await supabase
        .from('profiles')
        .select('instructor_code')
        .eq('instructor_code', code)
        .eq('role', 'staff')
        .eq('status', 'approved')
        .single()

    return !!data
}