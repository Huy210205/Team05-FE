// src/shared/types/notification.ts

/**
 * Loại thông báo từ backend
 */
export type NotificationType =
  | 'GRADE_UPDATED'           // Cập nhật điểm
  | 'ENROLLED_NEW_CLASS'      // Thêm vào lớp mới
  | 'REMOVED_FROM_CLASS'      // Xóa khỏi lớp
  | 'STUDENT_ENROLLED'        // Học viên được thêm vào lớp (cho giảng viên)
  | 'CLASS_UPDATED'           // Cập nhật thông tin lớp
  | 'CLASS_CREATED'           // Tạo lớp mới (activity log cho admin)
  | 'CENTER_CREATED'          // Tạo trung tâm mới (activity log cho admin)
  | 'LECTURER_GRADED'         // Giảng viên nhập điểm (activity log cho admin)
  | 'ATTENDANCE_RECORDED'     // Điểm danh
  | 'ATTENDANCE_UPDATED'      // Cập nhật điểm danh
  | 'ATTENDANCE_WARNING'      // Cảnh báo vắng học quá nhiều
  | 'GRADE_WARNING'           // Cảnh báo trượt quá nhiều bài thi
  | 'SYSTEM_ANNOUNCEMENT'     // Thông báo broadcast từ admin
  | 'SYSTEM'                  // Thông báo hệ thống
  | 'OTHER';                  // Khác

/**
 * Mức độ quan trọng
 */
export type NotificationSeverity = 'low' | 'medium' | 'high';

/**
 * Loại đối tượng liên quan
 */
export type RelatedType = 'CLASS' | 'STUDENT' | 'MODULE' | 'ATTENDANCE' | 'GRADE' | null;

/**
 * Thông báo từ backend
 */
export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedType?: RelatedType;
  relatedId?: number;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string; // ISO datetime string
}

/**
 * DTO tạo thông báo mới (Admin/Manager only)
 */
export interface NotificationCreateDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedType?: RelatedType;
  relatedId?: number;
  severity?: NotificationSeverity;
}
