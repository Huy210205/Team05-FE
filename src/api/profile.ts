// src/api/profile.ts
import api from '../shared/api/http';

export type ProfileRole = {
    code: string;
    scope: 'GLOBAL' | 'CENTER';
    centerName?: string | null;
};

export type KeycloakInfo = {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
};

export type Profile = {
    userId: number;
    fullName: string;
    email: string;
    keycloak: KeycloakInfo;
    roles: ProfileRole[];
    centerId?: number | null;
    centerName?: string | null;
};

export const getProfile = () => api.get<Profile>('/api/users/profile');