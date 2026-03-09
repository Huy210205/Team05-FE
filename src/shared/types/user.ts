// src/shared/types/user.ts

export type UserDto = {
    userId: number;
    fullName: string;
    email: string;
    phone: string;
    keycloakUserId: string;
    dob?: string | null;
    gender?: 'male' | 'female' | null;
    active: boolean;
    createdAt: string; // ISO
    updatedAt: string; // ISO
};
    
