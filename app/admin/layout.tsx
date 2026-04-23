import { redirect } from "next/navigation";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../convex/_generated/api";

/**
 * Server-side admin layout — the secure gate.
 *
 * This layout runs entirely on the server and performs two checks:
 * 1. isAuthenticated() — verifies the session token is valid (calls Convex site URL)
 * 2. fetchAuthQuery(getAuthenticatedUser) — verifies the user actually exists
 *    in the database by resolving ctx.auth.getUserIdentity() on the Convex backend
 *
 * If either check fails, the user is redirected to /authorisation-needed.
 * No client-side code is involved — this cannot be bypassed.
 */
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check 1: Is there a valid session token?
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        redirect("/authorisation-needed");
    }

    // Check 2: Does the user actually exist in the database?
    // This catches fake/expired tokens that somehow pass the first check
    const user = await fetchAuthQuery(api.users.getAuthenticatedUser);

    if (!user) {
        redirect("/authorisation-needed");
    }

    return <>{children}</>;
}
