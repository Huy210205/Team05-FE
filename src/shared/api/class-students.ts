import { getClassStudents } from './classes';

/**
 * Alias for getClassStudents to maintain backward compatibility
 * @deprecated Use getClassStudents from './classes' instead
 */
export const getStudentsByClassId = async (classId: number) => {
    const response = await getClassStudents(classId, {
        page: 0,
        size: 1000,
    });
    return response;
};

