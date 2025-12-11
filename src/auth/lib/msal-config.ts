import { Configuration, LogLevel } from '@azure/msal-browser';

/**
 * Configuration for MSAL.js
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */

// Get environment variables
const clientId = import.meta.env.VITE_MS_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_MS_TENANT_ID || 'common';
const authority = `https://login.microsoftonline.com/${tenantId}`;
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin + '/auth/callback';

export const msalConfig: Configuration = {
    auth: {
        clientId: clientId,
        authority: authority,
        redirectUri: redirectUri,
        postLogoutRedirectUri: window.location.origin,
        // Stay on the redirect URI (callback page) and let our app handle navigation afterward.
        // When true, MSAL will bounce back to the original start page after processing the hash,
        // which was causing us to land on /auth/signin before our callback logic finished.
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: 'sessionStorage', // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    default:
                        return;
                }
            },
            logLevel: LogLevel.Warning,
        },
    },
};

/**
 * Scopes for acquiring an access token
 */
export const loginRequest = {
    scopes: ['User.Read', 'User.ReadBasic.All'],
};

/**
 * Scopes for Microsoft Graph API
 */
export const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

/**
 * Domain validation - similar to backend validation
 */
export const ALLOWED_EMAIL_DOMAIN = '@goldentrust.com';
