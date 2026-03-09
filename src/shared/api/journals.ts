import http from './http';
import type {
  JournalResponse,
  CreateJournalRequest,
  UpdateJournalRequest,
  JournalType,
} from '../types/journal';

// ==================== CREATE ====================
/**
 * Tạo nhật ký lớp học mới
 * POST /api/journals
 */
export const createJournal = async (
  data: CreateJournalRequest
): Promise<JournalResponse> => {
  const response = await http.post('/api/journals', data);
  return response.data;
};

// ==================== UPDATE ====================
/**
 * Cập nhật nhật ký lớp học
 * PUT /api/journals/{journalId}
 */
export const updateJournal = async (
  journalId: number,
  data: UpdateJournalRequest
): Promise<JournalResponse> => {
  const response = await http.put(`/api/journals/${journalId}`, data);
  return response.data;
};

// ==================== DELETE ====================
/**
 * Xóa nhật ký lớp học (soft delete)
 * DELETE /api/journals/{journalId}
 */
export const deleteJournal = async (journalId: number): Promise<void> => {
  await http.delete(`/api/journals/${journalId}`);
};

// ==================== GET LIST ====================
/**
 * Lấy danh sách nhật ký theo lớp học
 * GET /api/journals/class/{classId}
 */
export const getJournalsByClass = async (
  classId: number,
  filters?: {
    journalType?: JournalType;
    fromDate?: string;
    toDate?: string;
  }
): Promise<JournalResponse[]> => {
  const params = new URLSearchParams();
  
  if (filters?.journalType) {
    params.append('journalType', filters.journalType);
  }
  if (filters?.fromDate) {
    params.append('fromDate', filters.fromDate);
  }
  if (filters?.toDate) {
    params.append('toDate', filters.toDate);
  }

  const queryString = params.toString();
  const url = queryString 
    ? `/api/journals/class/${classId}?${queryString}`
    : `/api/journals/class/${classId}`;

  const response = await http.get(url);
  return response.data;
};

/**
 * Lấy danh sách nhật ký theo giảng viên
 * GET /api/journals/teacher/{teacherId}
 */
export const getJournalsByTeacher = async (
  teacherId: number
): Promise<JournalResponse[]> => {
  const response = await http.get(`/api/journals/teacher/${teacherId}`);
  return response.data;
};
