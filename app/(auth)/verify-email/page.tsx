'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/lib/context/auth-context';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { user, isEmailVerified } = useAuth();
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && isEmailVerified) {
      router.push('/polls');
    }
  }, [user, isEmailVerified, router]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setMessage(null);
    
    try {
      // This would typically call a server action to resend verification email
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">Please log in to continue</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-slate-600">
            <p>Please check your email and click the verification link to continue.</p>
            <p className="mt-2">If you don't see the email, check your spam folder.</p>
          </div>
          
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification} 
              disabled={resendLoading}
              className="w-full"
              variant="outline"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
