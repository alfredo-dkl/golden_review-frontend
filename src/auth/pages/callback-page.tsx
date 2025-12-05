import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Callback page for Microsoft OAuth authentication redirects.
 * This component handles the authentication flow after a user signs in with Microsoft.
 * It processes the backend authentication callback.
 */
export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { handleCallback } = useAuth();

  useEffect(() => {
    // Get callback parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Authentication failed');
      // After a delay, redirect to signin page with error params
      setTimeout(() => {
        navigate(
          `/auth/signin?error=${errorParam}&error_description=${encodeURIComponent(errorDescription || 'Authentication failed')}`,
        );
      }, 1500);
      return;
    }

    if (!code || !state) {
      setError('Missing authentication parameters');
      setTimeout(() => {
        navigate('/auth/signin?error=invalid_callback');
      }, 1500);
      return;
    }

    // Handle the backend authentication callback
    const processCallback = async () => {
      try {
        console.log('Processing Microsoft OAuth callback with backend');

        // Handle callback through the auth context
        const result = await handleCallback(code, state);

        if (result.success) {
          console.log('Microsoft authentication successful', result.user);

          // Get the next URL - either from query param or default to root
          const nextPath = searchParams.get('next') || '/';

          // Navigate to the target page
          console.log('Redirecting to:', nextPath);
          navigate(nextPath);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (err) {
        console.error('Error processing Microsoft OAuth callback:', err);
        setError('An unexpected error occurred during authentication');

        // Redirect to login page after showing error
        setTimeout(() => {
          navigate(
            '/auth/signin?error=auth_callback_error&error_description=Failed to complete authentication',
          );
        }, 1500);
      }
    };

    processCallback();
  }, [navigate, searchParams, handleCallback]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {error ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-destructive">
            Authentication Error
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm">Redirecting to sign-in page...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Completing Microsoft Sign-in</h2>
          <p className="text-muted-foreground">Please wait while we finish setting up your session...</p>
        </div>
      )}
    </div>
  );
}
