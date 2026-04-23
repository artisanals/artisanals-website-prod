import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { rateLimitTables } from "convex-helpers/server/rateLimit";

export default defineSchema({
    /**
     * Personnel Keys — gated admin access control.
     * Each key is unique and can be permanently locked to a single email.
     * `isActive` serves as an admin kill-switch to revoke access.
     */
    personnelKeys: defineTable({
        key: v.string(),
        assignedEmail: v.optional(v.string()),
        isActive: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_key", ["key"])
        .index("by_assignedEmail", ["assignedEmail"]),

    /**
     * Rate limit state — managed by convex-helpers.
     * Required for the token-bucket rate limiter used in key validation.
     */
    ...rateLimitTables,
});
