// Mock override cho classes API - Dùng tạm để test
// Thêm vào đầu ExamManagementPage để test với dữ liệu giả

export const mockClassesResponse = {
    data: [
        {
            classId: 1,
            centerId: 1,
            centerName: 'CodeGym Hà Nội',
            programId: 101,
            programName: 'Fullstack JavaScript 2025',
            name: 'SCC-JS-01',
            description: 'Lớp học Fullstack JavaScript khóa đầu tiên',
            startDate: '2025-09-01',
            endDate: '2026-03-01',
            status: 'ONGOING',
            room: 'P101',
            capacity: 20,
            studyDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
            studyTime: 'EVENING',
            createdAt: '2025-08-15T10:00:00',
            updatedAt: '2025-08-15T10:00:00',
            createdBy: 1,
            updatedBy: 1,
            program: {
                programId: 101,
                code: 'FS-JS-2025',
                name: 'Fullstack JavaScript 2025',
                description: 'Chương trình học Fullstack JavaScript toàn diện',
                durationHours: 600,
                deliveryMode: 'OFFLINE',
                categoryCode: 'PROGRAMMING',
                isActive: true,
            },
        },
    ],
};

// Mock modules cho program (để sau này dùng cho cascade selection)
export const mockModulesForProgram = [
    // Semester 1
    { moduleId: 1, name: 'HTML & CSS Basics', semesterId: 1, semesterName: 'Semester 1', order: 1 },
    { moduleId: 2, name: 'JavaScript Fundamentals', semesterId: 1, semesterName: 'Semester 1', order: 2 },
    { moduleId: 3, name: 'React Basics', semesterId: 1, semesterName: 'Semester 1', order: 3 },

    // Semester 2
    { moduleId: 4, name: 'Node.js & Express', semesterId: 2, semesterName: 'Semester 2', order: 1 },
    { moduleId: 5, name: 'Database Design', semesterId: 2, semesterName: 'Semester 2', order: 2 },
    { moduleId: 6, name: 'REST API Development', semesterId: 2, semesterName: 'Semester 2', order: 3 },

    // Semester 3
    { moduleId: 7, name: 'Advanced React', semesterId: 3, semesterName: 'Semester 3', order: 1 },
    { moduleId: 8, name: 'State Management', semesterId: 3, semesterName: 'Semester 3', order: 2 },
    { moduleId: 9, name: 'Final Project', semesterId: 3, semesterName: 'Semester 3', order: 3 },
];

// Mock students cho lớp
export const mockStudentsForClass = [
    { studentId: 1, studentCode: 'SV001', fullName: 'Trần Văn An', email: 'an.tv@codegym.vn' },
    { studentId: 2, studentCode: 'SV002', fullName: 'Lê Thị Bình', email: 'binh.lt@codegym.vn' },
    { studentId: 3, studentCode: 'SV003', fullName: 'Phạm Văn Cường', email: 'cuong.pv@codegym.vn' },
    { studentId: 4, studentCode: 'SV004', fullName: 'Hoàng Thị Dung', email: 'dung.ht@codegym.vn' },
    { studentId: 5, studentCode: 'SV005', fullName: 'Vũ Văn Em', email: 'em.vv@codegym.vn' },
];
