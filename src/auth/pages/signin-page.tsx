import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, LoaderCircleIcon } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/icons';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional: show messages from redirects (password reset, etc.)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const description = searchParams.get('error_description');

    if (errorParam) {
      setError(description || 'Authentication error. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);
      // login() will redirect to Microsoft - code after this won't execute
      // Pass empty string since GoDaddy/Microsoft will handle email prompt
      await login('');
      // Note: The following code never runs because login() redirects the page
    } catch (err) {
      console.error('Microsoft sign-in error:', err);
      setIsLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign in with Microsoft. Please try again.',
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to GoldenAudit👋</h1>
        <p className="text-sm text-muted-foreground">
          Please sign-in to your account and start the adventure
        </p>
      </div>

      {error && (
        <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Signing in with Microsoft...
            </>
          ) : (
            <>
              <Icons.microsoft className="size-5" />
              Sign in with Microsoft
            </>
          )}
        </Button>
      </form>
    </div>
  );
}