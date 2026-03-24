import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { keycloak } from './keycloak';
import './index.css';

function renderApp() {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}

function renderFatalError(message: string) {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
                <h2>Application failed to start</h2>
                <p>{message}</p>
            </div>
        </React.StrictMode>,
    );
}

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

        // Use origin as a stable redirect URI to avoid Keycloak invalid redirect on deep routes.
        const redirectBase = window.location.origin;

        // init Keycloak, bắt buộc login trước khi render app
        const authenticated = await keycloak.init({
            onLoad: 'login-required',
            pkceMethod: 'S256',
            checkLoginIframe: false,
            redirectUri: redirectBase,
        });

        if (!authenticated || !keycloak.token) {
            await keycloak.login({ redirectUri: redirectBase });
            return;
        }

        // Expose token to window for debugging (access via window.token in console if needed)
        (window as any).token = keycloak.token;

        // Fetch profile best-effort. UI should still render even if this call fails.
        try {
            const { useUserProfile } = await import('./stores/userProfile');
            await useUserProfile.getState().fetchMe();
        } catch (profileError) {
            console.error('Failed to fetch user profile on bootstrap', profileError);
        }

        renderApp();
    } catch (e) {
        console.error('Application bootstrap failed', e);
        renderFatalError('Please refresh the page. If the issue continues, contact support.');
    }
}

bootstrap();
