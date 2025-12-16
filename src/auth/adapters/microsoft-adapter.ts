import { UserModel } from '@/auth/lib/models';
import { apiClient } from '@/lib/api-client';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest, graphConfig } from '@/auth/lib/msal-config';

// Global singleton to prevent multiple MSAL instances
let globalMsalInstance: PublicClientApplication | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;
let redirectResponse: AuthenticationResult | null = null; // Store redirect response from initialization
let isHandlingRedirect = false; // Flag to track if we're currently processing a redirect

/**
 * Microsoft Auth Adapter — uses MSAL.js to authenticate with Microsoft
 * Then creates session in backend with cookie-based authentication
 */
export const MicrosoftAuthAdapter = {
    get msalInstance(): PublicClientApplication | null {
        return globalMsalInstance;
    },

    get isInitialized(): boolean {
        return globalMsalInstance !== null;
    },

    /**
     * Initialize the MSAL instance (singleton pattern)
     */
    async initialize(): Promise<void> {
        // If already initialized, return immediately
        if (globalMsalInstance) {
            return;
        }

        // If initialization is in progress, wait for it
        if (isInitializing && initPromise) {
            return initPromise;
        }

        // Start initialization
        isInitializing = true;

        initPromise = (async () => {
            try {
                globalMsalInstance = new PublicClientApplication(msalConfig);
                await globalMsalInstance.initialize();

                // Handle redirect promise to capture Microsoft's response
                // Set flag to indicate we're handling redirect
                isHandlingRedirect = true;

                const response = await globalMsalInstance.handleRedirectPromise();

                if (response) {
                    redirectResponse = response;
                }
            } catch (error) {
                console.error('❌ MicrosoftAuthAdapter: Initialization failed:', error);
                globalMsalInstance = null;
                throw error;
            } finally {
                isInitializing = false;
                isHandlingRedirect = false;
                initPromise = null;
            }
        })();

        await initPromise;
    },

    /**
     * Ensure adapter is initialized before performing any operation
     */
    async ensureInitialized(): Promise<void> {
        // If an initialization is already running, wait for it to finish to avoid races
        if (isInitializing && initPromise) {
            await initPromise;
        } else if (!this.isInitialized) {
            const initResult = this.initialize();
            await initResult;
        } else if (initPromise) {
            // msalInstance exists but initialization promise still resolving (rare but possible)
            await initPromise;
        }
    },

    /**
     * Login using Microsoft MSAL
     */
    async login(email: string): Promise<void> {
        try {
            await this.ensureInitialized();

            if (!this.msalInstance) {
                throw new Error('MSAL instance not initialized');
            }

            // Prepare login request with email hint
            const request = {
                ...loginRequest,
                loginHint: email || undefined,
            };

            // Redirect to Microsoft login - will come back to callback page
            await this.msalInstance.loginRedirect(request);
        } catch (error: unknown) {
            console.error('MicrosoftAuthAdapter: Login error:', error);
            throw new Error((error as Error).message || 'Microsoft login failed');
        }
    },

    /**
     * Handle redirect callback from Microsoft authentication
     */
    async handleCallback(): Promise<{ user: UserModel }> {
        try {
            // IMPORTANT: Ensure initialization is complete before proceeding
            // This will wait for the handleRedirectPromise() to complete
            await this.ensureInitialized();

            if (!this.msalInstance) {
                throw new Error('MSAL instance not initialized');
            }

            // If initialization is still handling redirect, wait for it
            // This ensures we don't proceed until handleRedirectPromise() is done
            let waitAttempts = 0;
            const maxWaitAttempts = 50; // 5 seconds total (50 * 100ms)
            while (isHandlingRedirect && waitAttempts < maxWaitAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitAttempts++;
            }

            if (isHandlingRedirect) {
                console.error('❌ MicrosoftAuthAdapter: Timeout waiting for redirect handler');
                throw new Error('Timeout waiting for Microsoft authentication response');
            }

            // Use the redirect response captured during initialization
            let response = redirectResponse;

            // Fallback: if the response was not captured yet, attempt to process redirect now
            if (!response) {
                try {
                    isHandlingRedirect = true;
                    response = await this.msalInstance.handleRedirectPromise();
                    if (response) {
                        redirectResponse = response;
                    }
                } finally {
                    isHandlingRedirect = false;
                }
            }

            if (!response) {
                console.error('❌ MicrosoftAuthAdapter: No redirect response available');
                console.error('❌ MicrosoftAuthAdapter: redirectResponse was:', redirectResponse);
                console.error('❌ MicrosoftAuthAdapter: This usually means you navigated to callback page without going through Microsoft login');
                throw new Error('No response from Microsoft authentication');
            }
            // Clear the stored response after using it
            redirectResponse = null;

            // Get account info
            const account = response.account;
            if (!account) {
                throw new Error('No account information received');
            }
            // Acquire token silently for Graph API
            const tokenResponse = await this.msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: account,
            });

            // Get user profile from Microsoft Graph
            const graphUser = await this.getUserFromGraph(tokenResponse.accessToken);

            // Create session in backend with user data
            const sessionData = {
                email: graphUser.mail || graphUser.userPrincipalName,
                microsoftId: graphUser.id,
                name: graphUser.displayName,
                firstName: graphUser.givenName,
                lastName: graphUser.surname,
                position: graphUser.jobTitle,
                department: graphUser.department,
            };

            const sessionResponse = await apiClient.createSession(sessionData);

            return {
                user: this.mapBackendUserToUserModel(sessionResponse.user),
            };
        } catch (error: unknown) {
            console.error('❌ MicrosoftAuthAdapter: Callback error occurred');
            console.error('❌ MicrosoftAuthAdapter: Error type:', typeof error);
            console.error('❌ MicrosoftAuthAdapter: Error:', error);
            console.error('❌ MicrosoftAuthAdapter: Error message:', (error as Error)?.message);
            console.error('❌ MicrosoftAuthAdapter: Error stack:', (error as Error)?.stack);

            // Don't try to logout on callback errors - just throw
            // Attempting logout can cause "uninitialized_public_client_application" errors
            throw new Error((error as Error).message || 'Authentication callback failed');
        }
    },

    /**
     * Get user information from Microsoft Graph API
     */
    async getUserFromGraph(accessToken: string): Promise<{
        id: string;
        displayName: string;
        givenName: string;
        surname: string;
        userPrincipalName: string;
        mail: string;
        jobTitle?: string;
        department?: string;
    }> {
        const response = await fetch(graphConfig.graphMeEndpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error('❌ MicrosoftAuthAdapter: Graph API request failed');
            const errorText = await response.text();
            console.error('❌ MicrosoftAuthAdapter: Error details:', errorText);
            throw new Error('Failed to fetch user from Microsoft Graph');
        }

        const userData = await response.json();

        return userData;
    },

    /**
     * Get current user from backend session
     */
    async getCurrentUser(): Promise<UserModel | null> {
        try {
            await this.ensureInitialized();

            // First validate session (public endpoint that checks if session exists)
            const validation = await apiClient.validateSession();

            if (!validation.valid || !validation.user) {
                return null;
            }

            return this.mapBackendUserToUserModel(validation.user);
        } catch (error) {
            console.error('💥 MicrosoftAuthAdapter: Error getting user:', error);
            return null;
        }
    },

    /**
     * Logout from both MSAL and backend session
     */
    async logout(): Promise<void> {
        try {
            await this.ensureInitialized();

            // 1. Backend will clear the session cookie and database session
            try {
                await apiClient.logout();
            } catch (backendError) {
                console.error('⚠️ Backend logout error:', backendError);
                // Continue with Microsoft logout even if backend fails
            }

            // 2. Logout from Microsoft MSAL if we have an account
            if (this.msalInstance) {
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    // Use logoutRedirect to avoid popup and perform front-channel sign-out
                    await this.msalInstance.logoutRedirect({
                        account: accounts[0],
                        postLogoutRedirectUri: window.location.origin + '/auth/signin',
                    });
                } else {
                    console.log('ℹ️ No Microsoft accounts to logout from');
                }
            }
        } catch (error: unknown) {
            console.error('❌ MicrosoftAuthAdapter: Logout error:', error);
            throw new Error((error as Error).message || 'Logout failed');
        }
    },

    /**
     * Map backend user to frontend UserModel
     */
    mapBackendUserToUserModel(backendUser: {
        id: string;
        email: string;
        name: string;
        department: string;
        position: string;
        photoUrl?: string | null;
    }): UserModel {
        const fullname = backendUser.name || '';
        return {
            id: backendUser.id,
            email: backendUser.email,
            email_verified: true,
            fullname,
            first_name: fullname.split(' ')[0] || '',
            last_name: fullname.split(' ').slice(1).join(' ') || '',
            username: backendUser.email.split('@')[0] || backendUser.id,
            company_name: 'Golden Trust',
            occupation: backendUser.position,
            phone: '',
            roles: [],
            pic: backendUser.photoUrl || '',
            language: 'en' as const,
            is_admin: false, // Will be set based on backend logic
            isMicrosoftLogin: true,
        };
    },
};