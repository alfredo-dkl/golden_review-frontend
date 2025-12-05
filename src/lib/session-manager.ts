/**
 * Session Manager
 * Handles session token storage and validation
 */

export class SessionManager {
    private static readonly SESSION_TOKEN_KEY = 'sessionToken';
    private static readonly SESSION_EXPIRY_KEY = 'sessionExpiry';

    /**
     * Save session token and expiry
     */
    static saveSession(token: string, expiresAt: string): void {
        try {
            localStorage.setItem(this.SESSION_TOKEN_KEY, token);
            localStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt);
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    /**
     * Get current session token
     */
    static getSessionToken(): string | null {
        try {
            const token = localStorage.getItem(this.SESSION_TOKEN_KEY);
            const expiry = localStorage.getItem(this.SESSION_EXPIRY_KEY);

            // Check if session is expired
            if (token && expiry) {
                const expiryDate = new Date(expiry);
                const now = new Date();

                if (now >= expiryDate) {
                    console.log('Session expired, clearing...');
                    this.clearSession();
                    return null;
                }
            }

            return token;
        } catch (error) {
            console.error('Failed to get session token:', error);
            return null;
        }
    }

    /**
     * Check if session exists and is valid
     */
    static hasValidSession(): boolean {
        return this.getSessionToken() !== null;
    }

    /**
     * Clear session data
     */
    static clearSession(): void {
        try {
            localStorage.removeItem(this.SESSION_TOKEN_KEY);
            localStorage.removeItem(this.SESSION_EXPIRY_KEY);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    /**
     * Get session expiry date
     */
    static getSessionExpiry(): Date | null {
        try {
            const expiry = localStorage.getItem(this.SESSION_EXPIRY_KEY);
            return expiry ? new Date(expiry) : null;
        } catch (error) {
            console.error('Failed to get session expiry:', error);
            return null;
        }
    }

    /**
     * Check if session expires soon (within 5 minutes)
     */
    static isSessionExpiringSoon(): boolean {
        const expiry = this.getSessionExpiry();
        if (!expiry) return false;

        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        return expiry <= fiveMinutesFromNow;
    }
}