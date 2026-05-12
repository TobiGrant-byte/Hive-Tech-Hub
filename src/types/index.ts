// ============================================
// USER ROLES & STATUS
// ============================================

export type Role = 'student' | 'staff' | 'admin'
export type Status = 'pending' | 'approved' | 'rejected'

// ============================================
// USER / PROFILE
// ============================================

export interface Profile {
    id: string
    name: string
    email: string
    role: Role
    status: Status
    profile_picture_url: string | null
    instructor_code: string | null
    age: number | null
    date_of_birth: string | null
    course: string | null
    teaching_experience: string | null
    created_at: string
}

// ============================================
// POSTS (Main Page feed — admin only creates)
// ============================================

export interface Post {
    id: string
    author_id: string
    author_name: string
    author_picture_url: string | null
    content: string
    created_at: string
    reactions: Reaction[]
    comments: Comment[]
}

// ============================================
// REACTIONS
// ============================================

export interface Reaction {
    id: string
    post_id: string
    user_id: string
    emoji: string
    created_at: string
}

// ============================================
// COMMENTS
// ============================================

export interface Comment {
    id: string
    post_id: string
    user_id: string
    author_name: string
    author_picture_url: string | null
    content: string
    created_at: string
}

// ============================================
// SUGGESTIONS (anonymous — no user_id ever)
// ============================================

export interface Suggestion {
    id: string
    content: string
    created_at: string
    // deliberately no user_id — anonymous by design
}

// ============================================
// STAFF CLASS LOG / DIARY
// ============================================

export interface DiaryEntry {
    id: string
    staff_id: string
    topic: string
    week_number: number
    students_present: number
    notes: string
    file_urls: string[]
    checkin_time: string | null
    checkout_time: string | null
    created_at: string
}

// ============================================
// ASSIGNMENTS
// ============================================

export interface Assignment {
    id: string
    student_id: string
    student_name: string
    instructor_code: string         // links to staff's public INST-XXXX code
    content_text: string | null
    file_url: string | null
    grade: string | null            // null until graded
    feedback: string | null         // null until graded
    submitted_at: string
    graded_at: string | null
}

// ============================================
// STUDENT JOURNAL (private — nobody else sees)
// ============================================

export interface StudentJournal {
    id: string
    student_id: string
    content: string
    updated_at: string
}

// ============================================
// GRADES (what student sees on View Grades page)
// ============================================

export interface Grade {
    id: string
    assignment_id: string
    student_id: string
    instructor_code: string
    instructor_name: string
    subject: string
    grade: string
    feedback: string
    graded_at: string
}

// ============================================
// AUTH FORMS
// ============================================

export interface SignUpFormData {
    name: string
    email: string
    password: string
    role: 'student' | 'staff'      // admins never sign up publicly
}

export interface LoginFormData {
    email: string
    password: string
}

export interface ResetPasswordFormData {
    password: string
    confirmPassword: string
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
    data: T | null
    error: string | null
}

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

export interface DashboardStats {
    total_students: number
    total_staff: number
    pending_approvals: number
    total_assignments: number
    total_grades_sent: number
    suggestions_this_week: number
}