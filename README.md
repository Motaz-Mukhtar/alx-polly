# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

-   **Authentication**: Secure user sign-up and login.
-   **Poll Management**: Users can create, view, and delete their own polls.
-   **Voting System**: A straightforward system for casting and viewing votes.
-   **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: React Server Components and Client Components

---

## 🔒 Security Audit & Remediation Report

This section documents the security vulnerabilities that were identified during the security audit and how they were resolved.

### Critical Vulnerabilities Found & Fixed

#### 1. **Missing Email Verification Enforcement**
**Vulnerability**: The application allowed users to access protected routes without verifying their email addresses, potentially enabling unauthorized access through unverified accounts.

**Impact**: 
- Unverified users could access sensitive features
- Potential for abuse through fake email registrations
- Reduced security posture

**How it was encountered**: 
- Users could register with any email and immediately access the dashboard
- No server-side validation of `email_confirmed_at` field
- Middleware only checked for user existence, not verification status

**Resolution**:
- Enhanced middleware to check `user.email_confirmed_at` before allowing access to protected routes
- Added email verification check in auth actions
- Created dedicated email verification page (`/auth/verify-email`)
- Implemented auth callback handling for email verification links
- Added `requireAuth()` helper function that enforces both authentication and email verification

#### 2. **Insufficient Token Expiration Handling**
**Vulnerability**: The application didn't properly handle expired JWT tokens, potentially allowing continued access with invalid credentials.

**Impact**:
- Users could continue using expired sessions
- Security tokens remained valid beyond their intended lifetime
- Potential for session hijacking

**How it was encountered**:
- Middleware didn't check `session.expires_at` timestamp
- No automatic token refresh mechanism
- Expired sessions weren't properly cleared

**Resolution**:
- Enhanced middleware to check token expiration using `session.expires_at`
- Implemented automatic token refresh in auth context (refreshes tokens 5 minutes before expiry)
- Added proper session cleanup when tokens expire
- Enhanced auth context to handle expired sessions gracefully

#### 3. **Missing Backend Authorization Checks**
**Vulnerability**: Some server actions lacked proper authorization checks, potentially allowing users to perform actions on resources they don't own.

**Impact**:
- Users could potentially delete or modify polls they don't own
- Unauthorized access to sensitive operations
- Data integrity compromised

**How it was encountered**:
- `deletePoll` and `updatePoll` actions didn't verify poll ownership
- Server actions relied only on authentication, not authorization
- No validation that users could only modify their own resources

**Resolution**:
- Added ownership verification in all poll modification actions
- Implemented `requireAuth()` function that enforces both authentication and email verification
- Added proper error handling for unauthorized operations
- Enhanced input validation to prevent injection attacks

#### 4. **Input Validation Vulnerabilities**
**Vulnerability**: Lack of proper input validation could lead to injection attacks and data corruption.

**Impact**:
- Potential for SQL injection (though mitigated by Supabase)
- XSS attacks through malicious input
- Data corruption through oversized inputs

**How it was encountered**:
- No length limits on poll questions and options
- Missing input sanitization
- No validation of ID formats

**Resolution**:
- Added input length validation (questions: max 500 chars, options: max 200 chars)
- Implemented input trimming and sanitization
- Added ID format validation to prevent injection attacks
- Enhanced error messages for validation failures

#### 5. **Session Management Vulnerabilities**
**Vulnerability**: The authentication context lacked proper session validation and token refresh mechanisms.

**Impact**:
- Poor user experience with unexpected logouts
- Potential for session state inconsistencies
- No automatic handling of token expiration

**How it was encountered**:
- Auth context didn't handle session expiration
- No automatic token refresh
- Session state could become stale

**Resolution**:
- Enhanced auth context with proper session validation
- Implemented automatic token refresh mechanism
- Added proper error handling for session-related operations
- Enhanced user experience with better loading states and error messages

### Security Improvements Implemented

#### Enhanced Middleware (`lib/supabase/middleware.ts`)
- Added comprehensive session validation
- Implemented token expiration checks
- Added email verification enforcement
- Enhanced cookie management for expired sessions

#### Enhanced Auth Actions (`app/lib/actions/auth-actions.ts`)
- Added email verification checks in login process
- Implemented `requireAuth()` helper function
- Enhanced error handling and validation
- Added session refresh functionality

#### Enhanced Poll Actions (`app/lib/actions/poll-actions.ts`)
- Added ownership verification for all operations
- Implemented input validation and sanitization
- Enhanced error handling and security checks
- Added proper authorization enforcement

#### Enhanced Auth Context (`app/lib/context/auth-context.tsx`)
- Added automatic token refresh
- Implemented proper session validation
- Enhanced error handling and user experience
- Added email verification status tracking

#### New Security Pages
- **Email Verification Page** (`/auth/verify-email`): Handles unverified users
- **Auth Callback Page** (`/auth/callback`): Processes email verification links

### Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security validation
2. **Principle of Least Privilege**: Users can only access resources they own
3. **Input Validation**: Comprehensive validation of all user inputs
4. **Session Management**: Proper token handling and refresh mechanisms
5. **Error Handling**: Secure error messages that don't leak sensitive information
6. **Authentication Flow**: Proper email verification enforcement
7. **Authorization**: Resource-level access control

### Testing the Security Improvements

To verify the security improvements:

1. **Email Verification Test**:
   - Register a new account
   - Try to access `/polls` without verifying email
   - Should be redirected to `/auth/verify-email`

2. **Token Expiration Test**:
   - Login and wait for token to expire (or manually expire in browser dev tools)
   - Should be automatically redirected to login page

3. **Authorization Test**:
   - Create a poll with one account
   - Try to delete it with another account
   - Should receive "You can only delete your own polls" error

4. **Input Validation Test**:
   - Try to create a poll with extremely long text
   - Should receive validation error messages

---

## 🚀 Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed. Use the keys you created during the Supabase setup process.

**Required Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🔍 Security Audit Checklist

Use this checklist to verify all security improvements have been implemented:

- [x] Email verification enforcement
- [x] Token expiration handling
- [x] Backend authorization checks
- [x] Input validation and sanitization
- [x] Session management improvements
- [x] Middleware security enhancements
- [x] Auth context security improvements
- [x] Server action security enhancements
- [x] Error handling security
- [x] Cookie security management

---

## 📚 Additional Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security Documentation](https://supabase.com/docs/guides/security)

---

**Note**: This application has been thoroughly audited and secured. All identified vulnerabilities have been addressed with industry-standard security practices. The codebase now serves as a reference for implementing secure authentication and authorization in Next.js applications.
