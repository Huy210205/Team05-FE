// src/keycloak.ts
import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
    url: 'https://id.dev.codegym.vn/auth',
    realm: 'codegym-software-nhom-5',
    clientId: 'sis-fe',
});

// Helper: luôn chắc token còn hạn trước khi dùng
export async function ensureValidToken(minSeconds = 30): Promise<string | null> {
    if (!keycloak.authenticated) {
        return null;
    }

    try {
        await keycloak.updateToken(minSeconds);
        return keycloak.token ?? null;
    } catch (error) {
        await keycloak.login();
        return keycloak.token ?? null;
    }
}
