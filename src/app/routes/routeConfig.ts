import { lazy } from 'react';

// Central route configuration type
export interface AppRoute {
    path: string; // react-router path pattern
    component: React.ComponentType<any>; // React component to render
    allowedRoles?: string[]; // If set, route is protected and restricted to these roles
    redirectIfStudent?: boolean; // Special flag for root redirect logic
    index?: boolean; // Marks index route
    noLayout?: boolean; // If true, render without StudentLayout/AppLayout wrapper
}

// Lazy loaded pages (code splitting)
const DashboardPage = lazy(() => import('../../features/users/pages/dashboard/DashboardPage'));
const StudentDashboard = lazy(() => import('../../features/students/pages/StudentDashboard'));
const ProgressPage = lazy(() => import('../../features/students/pages/ProgressPage'));
const AchievementsPage = lazy(() => import('../../features/students/pages/AchievementsPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('../../features/roles/pages/RolesPage'));
const CentersPage = lazy(() => import('../../features/centers/pages/CentersPage'));
const ProgramsPage = lazy(() => import('../../features/users/pages/programs/ProgramsPage'));
const ClassesPage = lazy(() => import('../../features/users/pages/classes/ClassesPage'));
const StudentProfilePage = lazy(() => import('../../features/users/pages/students/StudentProfilePage'));
const StudentDetailPage = lazy(() => import('../../features/users/pages/students/StudentDetailPage'));
const SettingsPage = lazy(() => import('../../features/users/pages/settings/SettingsPage'));
const ActivityLogPage = lazy(() => import('../../features/users/pages/activity/ActivityLogPage'));
const MyClassesPage = lazy(() => import('../../features/students/pages/my-classes/MyClassesPage'));
const AllCoursesPage = lazy(() => import('../../features/students/pages/my-classes/AllCoursesPage'));
const QuizPage = lazy(() => import('../../features/students/pages/quiz/QuizPage'));
const ClassModulesPage = lazy(() => import('../../features/students/pages/my-classes/ClassModulesPage'));
const ModuleLessonsListPage = lazy(() => import('../../features/students/pages/my-classes/ModuleLessonsListPage'));
const LessonViewerPage = lazy(() => import('../../features/students/pages/my-classes/LessonViewerPage'));
const QuizTakePage = lazy(() => import('../../features/students/pages/my-classes/QuizTakePage'));
const MyGradesPage = lazy(() => import('../../features/students/pages/my-grades/MyGradesPage'));
const MyAttendancePage = lazy(() => import('../../features/students/pages/my-attendance/MyAttendancePage'));
const AttendancePage = lazy(() => import('../../features/users/pages/attendance/AttendancePage'));
const TakeAttendancePage = lazy(() => import('../../features/users/pages/attendance/TakeAttendancePage'));
const ExamManagementPage = lazy(() => import('../../features/users/pages/exams/ExamManagementPage'));
const AttendanceStatisticsPage = lazy(() => import('../../features/users/pages/statistics/AttendanceStatisticsPage'));
const AIChatPage = lazy(() => import('../../features/students/pages/AIChat/AIChatPage'));
const AIChatAnalyticsPage = lazy(() => import('../../features/users/pages/ai-chat-analytics/AIChatAnalyticsPage'));

// List of all application routes. Order does not matter except for root redirect logic.
export const appRoutes: AppRoute[] = [
    { path: '/', component: DashboardPage, redirectIfStudent: true, index: true },
    { path: '/progress', component: ProgressPage, allowedRoles: ['STUDENT'] },
    { path: '/achievements', component: AchievementsPage, allowedRoles: ['STUDENT'] },
    { path: '/users', component: UsersPage },
    { path: '/centers', component: CentersPage },
    { path: '/roles', component: RolesPage },
    { path: '/programs', component: ProgramsPage },
    { path: '/classes', component: ClassesPage },
    { path: '/students', component: StudentProfilePage },
    { path: '/students/:id', component: StudentDetailPage },
    { path: '/attendance', component: AttendancePage, allowedRoles: ['LECTURER'] },
    { path: '/attendance/take', component: TakeAttendancePage, allowedRoles: ['LECTURER'] },
    { path: '/exams', component: ExamManagementPage, allowedRoles: ['LECTURER'] },
    {
        path: '/statistics',
        component: AttendanceStatisticsPage,
        allowedRoles: ['LECTURER', 'ACADEMIC_STAFF', 'SUPER_ADMIN'],
    },
    {
        path: '/ai-chat-analytics',
        component: AIChatAnalyticsPage,
        allowedRoles: ['ACADEMIC_STAFF', 'SUPER_ADMIN'],
    },
    { path: '/my-classes', component: MyClassesPage, allowedRoles: ['STUDENT'] },
    { path: '/my-grades', component: MyGradesPage, allowedRoles: ['STUDENT'] },
    { path: '/my-attendance', component: MyAttendancePage, allowedRoles: ['STUDENT'] },
    {
        path: '/student/ai-chat',
        component: AIChatPage,
        allowedRoles: ['STUDENT', 'SUPER_ADMIN', 'ACADEMIC_STAFF', 'LECTURER'],
        noLayout: true,
    },
    { path: '/all-courses', component: AllCoursesPage, allowedRoles: ['STUDENT'], noLayout: true },
    { path: '/all-courses/:courseId', component: AllCoursesPage, allowedRoles: ['STUDENT'], noLayout: true },
    { path: '/quiz/:quizId', component: QuizPage, allowedRoles: ['STUDENT'], noLayout: true },
    { path: '/my-classes/:classId/modules', component: ClassModulesPage, allowedRoles: ['STUDENT'] },
    { path: '/my-classes/:classId/modules/:moduleId', component: ModuleLessonsListPage, allowedRoles: ['STUDENT'] },
    {
        path: '/my-classes/:classId/modules/:moduleId/lessons/:lessonId',
        component: LessonViewerPage,
        allowedRoles: ['STUDENT'],
        noLayout: true,
    },
    {
        path: '/my-classes/:classId/modules/:moduleId/lessons/:lessonId/quiz',
        component: QuizTakePage,
        allowedRoles: ['STUDENT'],
        noLayout: true,
    },
    { path: '/settings', component: SettingsPage },
    { path: '/activity-log', component: ActivityLogPage },
];

// Helper: map path->roles (could be used elsewhere for building menus)
export const routeRolesMap: Record<string, string[] | undefined> = Object.fromEntries(
    appRoutes.map((r) => [r.path, r.allowedRoles]),
);
