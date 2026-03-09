// src/stores/userProfile.ts
import { create } from 'zustand';
import { getProfile, type Profile } from '@/api/profile';

type State = {
    me?: Profile;
    loading: boolean;
    error?: string;
    fetchMe: () => Promise<void>;
};

export const useUserProfile = create<State>((set) => ({
    loading: false,
    async fetchMe() {
        try {
            set({ loading: true, error: undefined });
            const { data } = await getProfile();
            set({ me: data, loading: false });
        } catch (e: any) {
            set({
                error: e?.message || 'Fetch profile failed',
                loading: false,
            });
        }
    },
}));
