// Journal Types - Nhật ký lớp học

export type JournalType = 'PROGRESS' | 'ANNOUNCEMENT' | 'ISSUE' | 'NOTE' | 'OTHER';

export interface JournalResponse {
  journalId: number;
  classId: number;
  className?: string;
  teacherId: number;
  teacherName?: string;
  title: string;
  content: string;
  journalDate: string; // ISO date string (YYYY-MM-DD)
  journalTime: string; // Time string (HH:mm:ss)
  journalType: JournalType;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: string | null;
}

export interface CreateJournalRequest {
  classId: number;
  title: string;
  content: string;
  journalDate: string; // ISO date string (YYYY-MM-DD)
  journalTime: string; // Time string (HH:mm:ss)
  journalType: JournalType;
}

export interface UpdateJournalRequest {
  title?: string;
  content?: string;
  journalDate?: string; // ISO date string (YYYY-MM-DD)
  journalTime?: string; // Time string (HH:mm:ss)
  journalType?: JournalType;
}
