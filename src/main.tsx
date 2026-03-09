import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { keycloak } from './keycloak';
import './index.css';

// Ignore browser extension errors
window.addEventListener('error', (e) => {
    if (e.message?.includes('Could not establish connection')) {
        e.stopImmediatePropagation();
        return;
    }
});

async function bootstrap() {
    try {
        // Clear any corrupted OAuth state
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            window.history.replaceState({}, document.title, window.location.pathname);
            localStorage.removeItem('kc-callback');
        }

        // Lưu URL hiện tại trước khi Keycloak init
        const currentUrl = window.location.origin + window.location.pathname;

        // init Keycloak, bắt buộc login trước khi render app
        const authenticated = await keycloak.init({
            onLoad: 'login-required',
            pkceMethod: 'S256',
            checkLoginIframe: false,
            redirectUri: currentUrl,
        });

        if (!authenticated || !keycloak.token) {
            await keycloak.login();
            return;
        }

        // Expose token to window for debugging (access via window.token in console if needed)
        (window as any).token = keycloak.token;

        // Fetch user profile after Keycloak is ready and WAIT for it
        const { useUserProfile } = await import('./stores/userProfile');
        await useUserProfile.getState().fetchMe();

        ReactDOM.createRoot(document.getElementById('root')!).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        );
    } catch (e) {
        // Keycloak init error - handle silently or show user-friendly message
    }
}

bootstrap();
