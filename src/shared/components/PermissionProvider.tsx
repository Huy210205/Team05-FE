import React, { createContext, useContext, useMemo } from 'react';

type PermissionContextValue = {
    can: (perm: string) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children, current }: { children: React.ReactNode; current?: string[] }) {
    const set = useMemo(
        () =>
            new Set(current ?? [
                'users:create', 'users:update', 'users:delete', 'users:toggle',
                'users.create', 'users.edit', 'users.delete', 'users.toggle',
                'centers:create', 'centers:update', 'centers:disable',
                'centers.create', 'centers.edit', 'centers.delete'
            ]),
        [current],
    );
    const value = useMemo<PermissionContextValue>(() => ({ can: (p: string) => set.has(p) }), [set]);
    return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
    const ctx = useContext(PermissionContext);
    if (!ctx) throw new Error('PermissionProvider missing');
    return ctx;
}
