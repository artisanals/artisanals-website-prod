import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { defineRateLimits } from "convex-helpers/server/rateLimit";

// ─── Rate Limit Configuration ───────────────────────────────────────────────
// Token bucket: 5 attempts per 60 seconds per key, bursting up to 5.
const { rateLimit } = defineRateLimits({
    validateKey: {
        kind: "token bucket",
        rate: 5,
        period: 60_000, // 60 seconds
        capacity: 5,
    },
});

// ─── Public Mutations ───────────────────────────────────────────────────────

/**
 * Step 1 of the admin login flow.
 * Validates the personnel key + email pair before allowing the OTP send.
 *
 * Rules:
 * - Rate-limited by `personnelKey` (token bucket: 5/60s).
 * - Key must exist and be active.
 * - If key already has an assignedEmail, the input email must match (strict pairing).
 * - If key has no assignedEmail yet, the email is accepted (will be locked after OTP verification).
 *
 * Returns: { success: true } or { success: false, error: string, code: string }
 */
export const validatePersonnelKey = mutation({
    args: {
        personnelKey: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Rate limit check (keyed by the personnelKey being tested)
        const rateLimitResult = await rateLimit(ctx, {
            name: "validateKey",
            key: args.personnelKey,
        });

        if (!rateLimitResult.ok) {
            return {
                success: false as const,
                error: "Too many attempts. Please wait before trying again.",
                code: "RATE_LIMITED",
                retryAt: rateLimitResult.retryAt,
            };
        }

        // 2. Look up the personnel key
        const keyDoc = await ctx.db
            .query("personnelKeys")
            .withIndex("by_key", (q) => q.eq("key", args.personnelKey))
            .unique();

        if (!keyDoc) {
            return {
                success: false as const,
                error: "Invalid personnel key.",
                code: "KEY_NOT_FOUND",
            };
        }

        // 3. Check if the key is active (admin kill-switch)
        if (!keyDoc.isActive) {
            return {
                success: false as const,
                error: "This personnel key has been deactivated.",
                code: "KEY_DEACTIVATED",
            };
        }

        // 4. Strict email pairing enforcement
        if (keyDoc.assignedEmail && keyDoc.assignedEmail !== args.email) {
            return {
                success: false as const,
                error: "This key is already bound to a different email.",
                code: "EMAIL_MISMATCH",
            };
        }

        // All checks passed — client is clear to trigger OTP send
        return { success: true as const };
    },
});

/**
 * Step 2 of the admin login flow (post-OTP verification).
 * Locks the email to the personnel key if not already locked.
 *
 * Called after Better Auth successfully verifies the OTP and creates a session.
 */
export const lockPersonnelKeyEmail = mutation({
    args: {
        personnelKey: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const keyDoc = await ctx.db
            .query("personnelKeys")
            .withIndex("by_key", (q) => q.eq("key", args.personnelKey))
            .unique();

        if (!keyDoc) {
            throw new Error("Personnel key not found during lock phase.");
        }

        if (!keyDoc.isActive) {
            throw new Error("Personnel key deactivated during lock phase.");
        }

        // Lock the email if not already locked
        if (!keyDoc.assignedEmail) {
            await ctx.db.patch(keyDoc._id, {
                assignedEmail: args.email,
            });
        } else if (keyDoc.assignedEmail !== args.email) {
            throw new Error(
                "Email mismatch during lock phase — possible race condition."
            );
        }

        return { success: true as const };
    },
});

// ─── Internal / Admin Mutations ─────────────────────────────────────────────

/**
 * Admin-only: Create a new personnel key.
 * This should only be called from the Convex dashboard or by an internal function.
 */
export const createPersonnelKey = internalMutation({
    args: {
        key: v.string(),
    },
    handler: async (ctx, args) => {
        // Ensure no duplicate keys
        const existing = await ctx.db
            .query("personnelKeys")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .unique();

        if (existing) {
            throw new Error(`Personnel key "${args.key}" already exists.`);
        }

        const id = await ctx.db.insert("personnelKeys", {
            key: args.key,
            isActive: true,
            createdAt: Date.now(),
        });

        return id;
    },
});

/**
 * Admin-only: Toggle the active status of a personnel key (kill-switch).
 */
export const togglePersonnelKeyActive = internalMutation({
    args: {
        key: v.string(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const keyDoc = await ctx.db
            .query("personnelKeys")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .unique();

        if (!keyDoc) {
            throw new Error(`Personnel key "${args.key}" not found.`);
        }

        await ctx.db.patch(keyDoc._id, { isActive: args.isActive });
    },
});
