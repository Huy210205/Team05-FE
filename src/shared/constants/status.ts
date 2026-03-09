// Student status constants - chỉ có 3 trạng thái theo yêu cầu
export const STUDENT_STATUS = {
  PENDING: 'PENDING',    // đang chờ
  ACTIVE: 'ACTIVE',      // đang học
  DROPPED: 'DROPPED'     // nghỉ học
} as const;

// Enrollment status constants - có 4 trạng thái theo yêu cầu
export const ENROLLMENT_STATUS = {
  ACTIVE: 'ACTIVE',      // đang học
  SUSPENDED: 'SUSPENDED', // bảo lưu
  DROPPED: 'DROPPED',    // đã nghỉ
  GRADUATED: 'GRADUATED' // tốt nghiệp
} as const;

// Student status labels (Vietnamese)
export const STUDENT_STATUS_LABELS = {
  [STUDENT_STATUS.PENDING]: 'Đang chờ',
  [STUDENT_STATUS.ACTIVE]: 'Đang học',
  [STUDENT_STATUS.DROPPED]: 'Nghỉ học'
} as const;

// Enrollment status labels (Vietnamese)
export const ENROLLMENT_STATUS_LABELS = {
  [ENROLLMENT_STATUS.ACTIVE]: 'Đang học',
  [ENROLLMENT_STATUS.SUSPENDED]: 'Bảo lưu',
  [ENROLLMENT_STATUS.DROPPED]: 'Đã nghỉ',
  [ENROLLMENT_STATUS.GRADUATED]: 'Tốt nghiệp'
} as const;

// Student status colors
export const STUDENT_STATUS_COLORS = {
  [STUDENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [STUDENT_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [STUDENT_STATUS.DROPPED]: 'bg-red-100 text-red-800'
} as const;

// Enrollment status colors
export const ENROLLMENT_STATUS_COLORS = {
  [ENROLLMENT_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [ENROLLMENT_STATUS.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
  [ENROLLMENT_STATUS.DROPPED]: 'bg-red-100 text-red-800',
  [ENROLLMENT_STATUS.GRADUATED]: 'bg-blue-100 text-blue-800'
} as const;

// Type definitions
export type StudentStatus = typeof STUDENT_STATUS[keyof typeof STUDENT_STATUS];
export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS];
