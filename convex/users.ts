import { query } from "./_generated/server";

/**
 * Returns the authenticated user's identity info if they have a valid session.
 * Returns null if not authenticated.
 * This is called from the Next.js server layout to verify the user
 * exists in the database (not just a valid JWT, but a real user).
 */
export const getAuthenticatedUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return {
            tokenIdentifier: identity.tokenIdentifier,
            subject: identity.subject,
            name: identity.name,
            email: identity.email,
        };
    },
});
