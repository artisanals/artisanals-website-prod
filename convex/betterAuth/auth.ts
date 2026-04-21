import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { emailOTP, EmailOTPOptions } from "better-auth/plugins";
import { Resend } from "resend";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(
    components.betterAuth,
    {
        local: { schema },
        verbose: false,
    }
);

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
    return {
        appName: "artisanals-prod-website",
        baseURL: process.env.SITE_URL,
        secret: process.env.BETTER_AUTH_SECRET,
        database: authComponent.adapter(ctx),
        emailAndPassword: {
            enabled: true,
        },
        plugins: [
            convex({ authConfig }),
            emailOTP({
                async sendVerificationOTP({ email, otp, type }, request) {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const { error } = await resend.emails.send({
                        from: "Artisanals <no-reply@artisanals.in>",
                        to: email,
                        subject: "Your Verification Code",
                        text: `Your verification code is ${otp}`,
                    });
                    if (error) {
                        console.error("Failed to send OTP email:", error);
                        throw new Error("Failed to send verification email");
                    }
                },
            }),
        ],
    } satisfies BetterAuthOptions;
};

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
    return betterAuth(createAuthOptions(ctx));
};
