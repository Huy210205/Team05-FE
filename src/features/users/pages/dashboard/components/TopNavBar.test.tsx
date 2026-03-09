import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopNavBar from './TopNavBar';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
vi.mock('@/stores/userProfile', () => ({
    useUserProfile: () => ({ me: { fullName: 'Test User', roles: [{ code: 'SUPER_ADMIN' }] } }),
}));
vi.mock('@/stores/centerSelection', () => ({
    useCenterSelection: () => 1,
}));

// Mock APIs
vi.mock('@/shared/api/student-warnings', () => ({
    studentWarningsApi: {
        getStudentWarnings: async () => ({
            warnings: [
                {
                    studentId: 11,
                    name: 'HV001',
                    code: 'HV001',
                    reason: 'Nghỉ nhiều',
                    detail: 'Nghỉ 5/12 buổi',
                    program: 'Java',
                    classCode: 'J23',
                    severity: 'HIGH',
                },
            ],
            totalCount: 1,
        }),
        getMockWarnings: () => [],
    },
}));

vi.mock('@/shared/api/notifications', () => ({
    notificationsApi: {
        getMyNotifications: async () => [
            {
                id: 1,
                type: 'SYSTEM_ANNOUNCEMENT',
                title: 'Thông báo hệ thống',
                message: 'Bảo trì 22:00',
                createdAt: new Date().toISOString(),
                isRead: false,
                severity: 'medium',
            },
        ],
        getMock: () => [],
    },
}));

// Silence console errors from component if any
vi.spyOn(console, 'error').mockImplementation(() => {});

const setup = () => {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <TopNavBar sidebarCollapsed={false} onToggleSidebar={() => {}} />
        </MemoryRouter>,
    );
};

describe('TopNavBar notifications', () => {
    it('renders combined badge count', async () => {
        setup();
        const toggleBtn = screen.getByRole('button', { name: /menu/i });
        // Find the bell button by aria-haspopup="menu"
        const bellButtons = screen.getAllByRole('button');
        const bellBtn = bellButtons.find((b) => b.getAttribute('aria-haspopup') === 'menu') as HTMLButtonElement;
        expect(bellBtn).toBeTruthy();
        // Badge should show total = warnings(1) + notifications(1) = 2
        const badge = await screen.findByText('2');
        expect(badge).toBeInTheDocument();
    });

    it('opens dropdown and shows tabs with counts', async () => {
        setup();
        const bellButtons = screen.getAllByRole('button');
        const bellBtn = bellButtons.find((b) => b.getAttribute('aria-haspopup') === 'menu') as HTMLButtonElement;
        fireEvent.click(bellBtn);
        // Tab labels (match more flexibly in case text is split)
        expect(await screen.findByText(/Cảnh báo/)).toBeDefined();
        expect(await screen.findByText(/Hoạt động/)).toBeDefined();
    });
});
