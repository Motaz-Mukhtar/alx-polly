'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        
        // Get the access_token and refresh_token from URL params
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
            return;
          }

          // Get the user to check email verification status
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            if (user.email_confirmed_at) {
              setStatus('success');
              setMessage('Email verified successfully! Redirecting to dashboard...');
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                router.push('/polls');
              }, 2000);
            } else {
              setStatus('error');
              setMessage('Email verification failed. Please try again.');
            }
          } else {
            setStatus('error');
            setMessage('Failed to get user information');
          }
        } else {
          setStatus('error');
          setMessage('Invalid authentication parameters');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Verifying...</CardTitle>
            <CardDescription className="text-center">Please wait while we verify your email</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className={`text-2xl font-bold text-center ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'success' ? 'Success!' : 'Error'}
          </CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'success' ? (
            <div className="text-green-600">
              <p>Your email has been verified successfully.</p>
              <p className="text-sm mt-2">You will be redirected to the dashboard shortly.</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p>There was a problem verifying your email.</p>
              <p className="text-sm mt-2">Please try again or contact support.</p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
            
            {status === 'error' && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Try Registering Again</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
