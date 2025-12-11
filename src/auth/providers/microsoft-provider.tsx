import { PropsWithChildren, useEffect, useState, useRef } from 'react';
import { MicrosoftAuthAdapter } from '@/auth/adapters/microsoft-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import { AuthModel, UserModel } from '@/auth/lib/models';

export function AuthProvider({ children }: PropsWithChildren) {
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState<AuthModel | undefined>();
    const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
    const [isAdmin, setIsAdmin] = useState(false);
    const hasInitialized = useRef(false);

    // Check if user is admin
    useEffect(() => {
        setIsAdmin(currentUser?.is_admin === true);
    }, [currentUser]);

    // Initialize session (on page reload) - only once
    useEffect(() => {
        // Prevent double initialization in React Strict Mode
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        const init = async () => {
            try {
                // Initialize Microsoft adapter
                await MicrosoftAuthAdapter.initialize();

                // Skip session check if we're on the callback page
                // The callback page will handle authentication
                if (window.location.pathname === '/auth/callback') {
                    setLoading(false);
                    return;
                }

                // Check if we have a valid session with the backend (via cookie)
                const user = await MicrosoftAuthAdapter.getCurrentUser();
                if (user) {
                    setCurrentUser(user);
                    // Create a minimal auth object to indicate authenticated state
                    setAuth({ access_token: 'session', refresh_token: '' });
                }
            } catch (err) {
                console.error('❌ AuthProvider: Initialization error', err);
                // Clear any invalid session data
                setAuth(undefined);
                setCurrentUser(undefined);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const saveAuth = (auth: AuthModel | undefined) => {
        setAuth(auth);
        // No need to save to localStorage - cookies handle it
    };

    // Login with Microsoft through backend
    const login = async (email: string) => {
        try {
            setLoading(true);
            // This will redirect to Microsoft login
            await MicrosoftAuthAdapter.login(email);
            // Note: The actual auth completion happens in the callback page
        } catch (error) {
            setLoading(false);
            setAuth(undefined);
            throw error;
        }
    };

    // Handle authentication callback (called from callback page)
    const handleCallback = async () => {
        try {
            setLoading(true);
            const { user } = await MicrosoftAuthAdapter.handleCallback();
            // Session is now in cookie - just update local state
            setAuth({ access_token: 'session', refresh_token: '' });
            setCurrentUser(user);
            return { success: true, user };
        } catch (error) {
            console.error('❌ AuthProvider: Callback error occurred');
            console.error('❌ AuthProvider: Error type:', typeof error);
            console.error('❌ AuthProvider: Error:', error);
            console.error('❌ AuthProvider: Error message:', (error as Error)?.message);
            console.error('❌ AuthProvider: Error stack:', (error as Error)?.stack);

            setAuth(undefined);
            setCurrentUser(undefined);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get current user
    const getUser = async () => {
        return await MicrosoftAuthAdapter.getCurrentUser();
    };

    // Update profile (if supported)
    const updateProfile = async (userData: Partial<UserModel>) => {
        // optional — depends on what you want to allow users to edit
        console.warn('updateProfile not supported for MicrosoftAuthAdapter');
        return userData as UserModel;
    };

    // Logout
    const logout = async () => {
        try {
            await MicrosoftAuthAdapter.logout();
        } finally {
            setAuth(undefined);
            setCurrentUser(undefined);
        }
    };

    // Verification — simple recheck
    const verify = async () => {
        try {
            const user = await getUser();
            if (user) {
                setCurrentUser(user);
                // Ensure we have an auth object
                if (!auth) {
                    setAuth({ access_token: 'session', refresh_token: '' });
                }
            } else {
                setAuth(undefined);
                setCurrentUser(undefined);
            }
        } catch {
            setAuth(undefined);
            setCurrentUser(undefined);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                loading,
                setLoading,
                auth,
                saveAuth,
                user: currentUser,
                setUser: setCurrentUser,
                login,
                getUser,
                updateProfile,
                logout,
                verify,
                handleCallback,
                isAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}