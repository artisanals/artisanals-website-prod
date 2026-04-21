# Architecture Specification: Artisanals Admin - Gated Email OTP (v2)

## Tech Stack

- Next.js 16 (App Router)
- Convex Cloud (Database)
- Better-auth (Authentication management & Session logic)
- Resend (Email OTP delivery)
- convex-helpers (Native rate-limiting)
- Package Manager: bun

## Core Objectives

1. **Strict Key-Email Pairing**: A `personnelKey` is permanently locked to a single email upon first successful login. Mismatches are rejected instantly.
2. **Session Assassination**: Enforce a strict 1-active-session rule. New logins automatically terminate older active sessions for that user.
3. **Native Convex Rate Limiting**: Protect database bandwidth using `convex-helpers` (token bucket) entirely within the Convex ecosystem—no external Redis required.

## System Workflow & Architecture

### 1. Pre-Authentication & Rate Limiting (Convex Layer)

- **Rate Limiter Integration**: Implement `convex-helpers` rate limiting directly inside the key-validation mutation.
- **Server Action / Convex Mutation** (`requestAdminOtp`):
    - Step 1: Check rate limit for the IP/identifier. Throws Convex error if exceeded.
    - Step 2: Query Convex: `getPersonnelKey(key)`.
    - Step 3: Edge Case Handling:
        - Key does not exist or `isActive === false` -> Return Error.
        - Key exists, and `assignedEmail` is NOT null, but DOES NOT match the input email -> Return 403 (Strict Pairing Violation).
    - Step 4: If checks pass, trigger Better-auth's `email-otp` flow via the `sendVerificationEmail` hook, which uses Resend to deliver the OTP.

### 2. The Verification & Locking Phase

- User inputs the OTP received via email.
- Better-auth verifies the OTP.
- **Post-Verification Hook**:
    - Once OTP is verified and the User object is created/fetched, execute a Convex mutation to update the `personnelKeys` table.
    - Set `assignedEmail = user.email` (if it was previously null). This permanently locks the key.

### 3. Session Assassination (Exclusivity Enforcement)

- Hook into Better-auth's session creation lifecycle (`databaseHooks.session.create` or standard callbacks).
- Before returning the newly created session:
    - Query Convex for all active sessions associated with the current `userId`.
    - Iterate through any existing sessions and explicitly revoke/delete them.
    - Proceed with returning the single, new valid session to the client.

## Database Schema Requirements (Convex)

- `users`: Standard Better-auth fields + `personnelKeyId` (reference).
- `sessions`: Standard Better-auth fields.
- `personnelKeys`:
    - `key` (v.string() - unique)
    - `assignedEmail` (v.optional(v.string()) - locks the key)
    - `isActive` (v.boolean() - admin kill switch)
    - `createdAt` (v.number())
- `rateLimits`: Handled natively by the `convex-helpers` schema implementation.

## Implementation Steps for Coding Agent

1. Initialize the project using `bun`.
2. Setup Convex and install `convex-helpers` to configure the native token-bucket rate limiter.
3. Configure Better-auth with the Convex adapter, Resend email provider, and `email-otp` plugin.
4. Create the `personnelKeys` schema and an admin-only mutation to generate them.
5. Write the `requestAdminOtp` Convex mutation (incorporating the rate limit check and email-lock validation).
6. Implement the Better-auth session hook to delete older sessions whenever a new session is created.
