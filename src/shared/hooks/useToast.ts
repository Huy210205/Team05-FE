import { useToastInternal } from '../components/ToastProvider';

export function useToast() {
    const { show } = useToastInternal();
    return {
        success: (title: string, description?: string) => show({ title, description, variant: 'success' }),
        error: (title: string, description?: string) => show({ title, description, variant: 'error' }),
        info: (title: string, description?: string) => show({ title, description, variant: 'info' }),
    };
}
