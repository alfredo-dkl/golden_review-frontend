import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, LoaderCircleIcon } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/common/icons';
import { ALLOWED_EMAIL_DOMAIN } from '@/auth/adapters/msalConfig';

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
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

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Domain validation - only allow specific domain emails
    if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      setError(`Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔹 Initiating Microsoft login with email:', email);
      await login(email);

      // Navigate to next or home
      const nextPath = searchParams.get('next') || '/';
      navigate(nextPath);
    } catch (err) {
      console.error('Microsoft sign-in error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign in with Microsoft. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your {ALLOWED_EMAIL_DOMAIN} email to sign in with Microsoft.
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
        <div className="space-y-2">
          <Label htmlFor="email">Email address <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            placeholder={`yourname${ALLOWED_EMAIL_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full"
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
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