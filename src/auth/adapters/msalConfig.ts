import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MS_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID}`,
        redirectUri: import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
        postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || `${window.location.origin}/auth/signin`,
    },
};

export const LOGIN_SCOPES = ['User.Read', 'email', 'openid', 'profile'];

// Domain validation - similar to backend validation
export const ALLOWED_EMAIL_DOMAIN = '@goldentrust.com';