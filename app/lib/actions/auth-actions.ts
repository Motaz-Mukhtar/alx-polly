'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { redirect } from 'next/navigation';

export async function login(data: LoginFormData) {
  const supabase = await createClient();

  const { error, data: authData } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email is verified
  if (authData.user && !authData.user.email_confirmed_at) {
    return { error: 'Please verify your email before logging in.' };
  }

  // Success: no error
  return { error: null };
}

export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required
  if (authData.user && !authData.user.email_confirmed_at) {
    return { 
      error: null, 
      message: 'Registration successful! Please check your email to verify your account.' 
    };
  }

  // Success: no error
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    return null;
  }
  
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return null;
  }
  
  return data.session;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  
  // Check if email is verified
  if (!user.email_confirmed_at) {
    redirect('/auth/verify-email');
  }
  
  return user;
}

export async function refreshSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    return null;
  }
  
  return data.session;
}
