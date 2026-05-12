import { createClient } from '@/lib/supabaseClient'

// Generates a unique INST-XXXX code for staff members
// Called automatically at signup — never manually

export async function generateInstructorCode(): Promise<string> {
    const supabase = createClient()

    let code = ''
    let isUnique = false

    while (!isUnique) {
        // Generate INST- followed by a random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        code = `INST-${randomNum}`

        // Check if this code already exists in the database
        const { data } = await supabase
            .from('profiles')
            .select('instructor_code')
            .eq('instructor_code', code)
            .single()

        // If no match found, the code is unique — exit the loop
        if (!data) {
            isUnique = true
        }
    }

    return code
}