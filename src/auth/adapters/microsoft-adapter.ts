import { UserModel } from '@/auth/lib/models';
import { apiClient } from '@/lib/api-client';

/**
 * Microsoft Auth Adapter — uses backend API with cookie-based sessions
 * All authentication state is managed by backend cookies
 */
export const MicrosoftAuthAdapter = {
    isInitialized: false,

    /**
     * Initialize the adapter
     */
    async initialize(): Promise<void> {
        if (!this.isInitialized) {
            console.log('MicrosoftAuthAdapter: Initializing...');
            this.isInitialized = true;
            console.log('MicrosoftAuthAdapter: Initialized successfully');
        }
    },

    /**
     * Ensure adapter is initialized before performing any operation
     */
    async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    },

    /**
     * Login using Microsoft through backend
     */
    async login(email: string): Promise<void> {
        console.log('MicrosoftAuthAdapter: Starting login via backend...', email ? `with email hint: ${email}` : '');

        try {
            await this.ensureInitialized();

            // Get auth URL from backend
            const { authUrl } = await apiClient.initiateLogin();

            console.log('MicrosoftAuthAdapter: Redirecting to Microsoft login...');

            // Redirect to Microsoft login - session will be created in callback
            window.location.href = authUrl;
        } catch (error: unknown) {
            console.error('MicrosoftAuthAdapter: Login error:', error);
            throw new Error((error as Error).message || 'Microsoft login failed');
        }
    },

    /**
     * Handle callback from Microsoft authentication
     */
    async handleCallback(code: string, state: string): Promise<{ user: UserModel }> {
        console.log('MicrosoftAuthAdapter: Handling auth callback...');

        try {
            // Send code to backend - session is created in cookie automatically
            await apiClient.handleAuthCallback(code, state);

            console.log('MicrosoftAuthAdapter: Callback handled successfully, session stored in cookie');

            // Get user data from the now-authenticated session
            const userResponse = await apiClient.getCurrentUser();

            return {
                user: this.mapBackendUserToUserModel(userResponse.user),
            };
        } catch (error: unknown) {
            console.error('MicrosoftAuthAdapter: Callback error:', error);
            throw new Error((error as Error).message || 'Authentication callback failed');
        }
    },

    /**
     * Get current user from backend session
     */
    async getCurrentUser(): Promise<UserModel | null> {
        console.log('MicrosoftAuthAdapter: Retrieving current user from backend...');

        try {
            await this.ensureInitialized();

            // First validate the session
            const sessionResponse = await apiClient.validateSession();

            if (!sessionResponse.valid) {
                console.log('MicrosoftAuthAdapter: Session not valid');
                return null;
            }

            // Get user data
            const userResponse = await apiClient.getCurrentUser();

            console.log('MicrosoftAuthAdapter: User retrieved successfully');

            return this.mapBackendUserToUserModel(userResponse.user);
        } catch (error) {
            console.error('MicrosoftAuthAdapter: Error getting user:', error);
            return null;
        }
    },

    /**
     * Logout from backend session
     */
    async logout(): Promise<void> {
        console.log('MicrosoftAuthAdapter: Logging out...');

        try {
            await this.ensureInitialized();

            // Backend will clear the session cookie
            await apiClient.logout();

            console.log('MicrosoftAuthAdapter: Logout successful');
        } catch (error: unknown) {
            console.error('MicrosoftAuthAdapter: Logout error:', error);
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
    }): UserModel {
        return {
            id: backendUser.id,
            email: backendUser.email,
            email_verified: true,
            fullname: backendUser.name,
            first_name: backendUser.name.split(' ')[0] || '',
            last_name: backendUser.name.split(' ').slice(1).join(' ') || '',
            username: backendUser.email.split('@')[0] || backendUser.id,
            company_name: 'Golden Trust',
            occupation: backendUser.position,
            phone: '',
            roles: [],
            pic: '',
            language: 'en' as const,
            is_admin: false, // Will be set based on backend logic
            isMicrosoftLogin: true,
        };
    },
};