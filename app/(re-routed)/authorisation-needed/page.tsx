"use client";

// global imports
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";

// local imports
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "artisanals_admin_auth_progress";

const AuthorisationNeededPage = () => {
    // Local State Management
    const [codeSent, setCodeSent] = useState(false);
    const [sessionCodeSent, setSessionCodeSent] = useState(false);

    const [isSendingCode, setIsSendingCode] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRestored, setIsRestored] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const router = useRouter();

    // Convex mutations
    const validateKey = useMutation(api.personnelKeys.validatePersonnelKey);
    const lockKey = useMutation(api.personnelKeys.lockPersonnelKeyEmail);

    // 60-Second Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const form = useForm({
        defaultValues: {
            personnelKey: "",
            email: "",
            code: "", // Ephemeral: never touches localStorage
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setServerError(null);

            try {
                // Step 1: Verify the OTP with Better Auth
                const { data, error } = await authClient.signIn.emailOtp({
                    email: value.email,
                    otp: value.code,
                });

                if (error) {
                    setServerError(error.message ?? "OTP verification failed.");
                    toast.error("Verification Failed", {
                        description: error.message ?? "Invalid or expired code.",
                        className: "font-mona-sans bg-red-50 text-red-700 border-red-200",
                    });
                    return;
                }

                // Step 2: Lock the personnel key to this email (idempotent if already locked)
                await lockKey({
                    personnelKey: value.personnelKey,
                    email: value.email,
                });

                console.log("Admin verified. Clearing local state...");
                toast.success("Access Granted", {
                    description: "Identity verified. Redirecting to dashboard...",
                    className: "font-mona-sans bg-green-50 text-green-700 border-green-200",
                });

                // 🧹 Clean up on success
                localStorage.removeItem(STORAGE_KEY);

                // Route to admin dashboard
                router.push("/admin");
            } catch (error: any) {
                console.error("Auth failed:", error);
                setServerError(
                    error?.message ?? "Authentication failed. Please try again."
                );
                toast.error("Authentication Error", {
                    description: error?.message ?? "Authentication failed. Please try again.",
                    className: "font-mona-sans bg-red-50 text-red-700 border-red-200",
                });
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // 1. Hydration Phase (Read once on mount)
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.personnelKey)
                    form.setFieldValue("personnelKey", parsed.personnelKey);
                if (parsed.email) form.setFieldValue("email", parsed.email);
                if (parsed.codeSent) {
                    setCodeSent(parsed.codeSent);
                    toast.info("Session Restored", {
                        description: "Your previous form progress has been recovered.",
                        className: "font-mona-sans bg-blue-50 text-blue-800 border-blue-200",
                    });
                }
            } catch (err) {
                console.error("Failed to restore admin form state:", err);
            }
        }
        setIsRestored(true);
    }, [form]);

    // 2. Persistence Phase (Observe TanStack store directly)
    useEffect(() => {
        if (!isRestored) return;

        const { unsubscribe } = form.store.subscribe(() => {
            const currentValues = form.state.values;

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    personnelKey: currentValues.personnelKey,
                    email: currentValues.email,
                    codeSent: codeSent,
                })
            );
        });

        return () => unsubscribe();
    }, [form.store, isRestored, codeSent]);

    const handleSendCode = async () => {
        const personnelKey = form.getFieldValue("personnelKey");
        const email = form.getFieldValue("email");

        if (personnelKey && email && email.includes("@")) {
            setIsSendingCode(true);
            setServerError(null);
            try {
                // Step 1: Validate personnel key + email pair in Convex
                const result = await validateKey({
                    personnelKey,
                    email,
                });

                if (!result.success) {
                    setServerError(result.error);
                    toast.error("Verification Failed", {
                        description: result.error,
                        className: "font-mona-sans bg-red-50 text-red-700 border-red-200",
                    });
                    return;
                }

                // Step 2: Key is valid — send OTP via Better Auth
                const { data, error } = await authClient.emailOtp.sendVerificationOtp({
                    email,
                    type: "sign-in",
                });

                if (error) {
                    throw new Error(error.message ?? "Failed to send verification code. Please try again.");
                }

                if (sessionCodeSent) {
                    toast.success("Code Resent", {
                        description: `A new verification code was sent to ${email}`,
                        className: "font-mona-sans bg-zinc-900 text-white border-zinc-800",
                    });
                } else {
                    toast.success("Verification Code Sent", {
                        description: `We've sent a 10-digit code to ${email}`,
                        className: "font-mona-sans bg-zinc-900 text-white border-zinc-800",
                    });
                }

                setCodeSent(true);
                setSessionCodeSent(true);
                setTimeLeft(60);
            } catch (error: any) {
                console.error("Failed to send code", error);
                setServerError(
                    error?.message ?? "Failed to send verification code."
                );
                toast.error("Failed to Send Code", {
                    description: error?.message ?? "Failed to send verification code. Please try again.",
                    className: "font-mona-sans bg-red-50 text-red-700 border-red-200",
                });
            } finally {
                setIsSendingCode(false);
            }
        } else {
            form.validateAllFields("change");
            form.validateAllFields("blur");
        }
    };

    return (
        <div className="bg-dotted no-scrollbar flex h-screen w-screen justify-between overflow-x-hidden px-12 py-8">
            <div className="flex flex-col justify-between">
                <div className="flex justify-between">
                    <p className="font-mona-sans text-md font-medium text-zinc-900">
                        artisanals
                    </p>
                </div>

                <div className="flex flex-col gap-y-10">
                    <div className="space-y-6">
                        <p className="font-mona-sans text-[68px] leading-[115%] font-medium text-zinc-900">
                            Yo, admin pages are gated.
                        </p>

                        <p className="font-mona-sans text-xl leading-[115%] font-medium text-zinc-800">
                            Let&apos;s verify your identity with your Personnel
                            Key & OTC and get you in.
                        </p>
                    </div>

                    {/* Server Error Banner */}
                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="font-mono text-sm font-medium text-red-700">
                                {serverError}
                            </p>
                        </div>
                    )}

                    <div className="mt-10 w-full">
                        <div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit();
                                }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    {/* Personnel Key Field */}
                                    <form.Field
                                        name="personnelKey"
                                        validators={{
                                            onChange: z
                                                .string()
                                                .min(
                                                    1,
                                                    "Personnel Key is required"
                                                ),
                                        }}
                                        children={(field) => (
                                            <div className="group space-y-2">
                                                <label className="font-mona-sans text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
                                                    Personnel Key
                                                </label>
                                                <input
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /[^a-zA-Z0-9-]/g,
                                                                ""
                                                            );
                                                        field.handleChange(
                                                            value
                                                        );
                                                    }}
                                                    autoComplete="off"
                                                    className={cn(
                                                        "w-full border-b-2 bg-transparent py-3 font-mono text-lg font-medium tracking-widest uppercase transition-all duration-500 outline-none",
                                                        field.state.meta
                                                            .isTouched &&
                                                            field.state.meta
                                                                .errors.length >
                                                                0
                                                            ? "border-red-500 text-red-500"
                                                            : "border-zinc-200 text-zinc-900 focus:border-zinc-900 focus:placeholder:opacity-0"
                                                    )}
                                                    placeholder="PK-Name-000-000"
                                                />
                                                <div className="h-4">
                                                    {field.state.meta
                                                        .isTouched &&
                                                        field.state.meta.errors
                                                            .length > 0 && (
                                                            <p className="text-[10px] font-bold text-red-500 uppercase">
                                                                {(
                                                                    field.state
                                                                        .meta
                                                                        .errors[0] as any
                                                                )?.message ??
                                                                    field.state
                                                                        .meta
                                                                        .errors[0]}
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    />

                                    {/* Email & Send Code Row */}
                                    <form.Field
                                        name="email"
                                        validators={{
                                            onBlur: z
                                                .string()
                                                .email("Invalid email address"),
                                        }}
                                        children={(field) => (
                                            <div className="group space-y-2">
                                                <label className="font-mona-sans text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
                                                    Email Address
                                                </label>

                                                {/* Unified Border Container */}
                                                <div
                                                    className={cn(
                                                        "flex w-full items-center justify-between border-b-2 transition-all duration-500",
                                                        field.state.meta
                                                            .isTouched &&
                                                            field.state.meta
                                                                .errors.length >
                                                                0
                                                            ? "border-red-500 focus-within:border-red-500"
                                                            : "border-zinc-200 focus-within:border-zinc-900"
                                                    )}
                                                >
                                                    <input
                                                        name={field.name}
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(e) =>
                                                            field.handleChange(
                                                                e.target.value
                                                            )
                                                        }
                                                        type="email"
                                                        autoComplete="email"
                                                        className={cn(
                                                            "w-full bg-transparent py-3 font-mono text-lg tracking-widest uppercase transition-all duration-500 outline-none",
                                                            "focus:placeholder:opacity-0",
                                                            field.state.meta
                                                                .isTouched &&
                                                                field.state.meta
                                                                    .errors
                                                                    .length > 0
                                                                ? "text-red-500"
                                                                : "text-zinc-900"
                                                        )}
                                                        placeholder="admin@artisanals.com"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={handleSendCode}
                                                        disabled={
                                                            isSendingCode ||
                                                            timeLeft > 0
                                                        }
                                                        className={cn(
                                                            "pl-4 font-mono text-lg font-medium tracking-wider whitespace-nowrap uppercase transition-colors",
                                                            isSendingCode ||
                                                                timeLeft > 0
                                                                ? "cursor-not-allowed text-zinc-400"
                                                                : "cursor-pointer text-zinc-900 hover:text-zinc-500 active:text-zinc-900"
                                                        )}
                                                    >
                                                        {isSendingCode ? (
                                                            <div className="flex items-center gap-2">
                                                                <span>
                                                                    Sending
                                                                </span>
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                                                            </div>
                                                        ) : timeLeft > 0 ? (
                                                            <span className="text-green-700">
                                                                Code Sent ✓
                                                            </span>
                                                        ) : sessionCodeSent ===
                                                          true ? (
                                                            "Resend Code"
                                                        ) : (
                                                            "Send Code"
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Errors & Timer Footer */}
                                                <div className="flex h-4 items-start justify-between">
                                                    <div>
                                                        {field.state.meta
                                                            .isTouched &&
                                                            field.state.meta
                                                                .errors.length >
                                                                0 && (
                                                                <p className="text-[10px] font-bold text-red-500 uppercase">
                                                                    {(
                                                                        field
                                                                            .state
                                                                            .meta
                                                                            .errors[0] as any
                                                                    )
                                                                        ?.message ??
                                                                        field
                                                                            .state
                                                                            .meta
                                                                            .errors[0]}
                                                                </p>
                                                            )}
                                                    </div>
                                                    {timeLeft > 0 && (
                                                        <p className="font-mona-sans text-[10px] tracking-widest text-zinc-500 uppercase">
                                                            Resend in {timeLeft}{" "}
                                                            secs
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    />

                                    {/* Standardized Code Field (Always Visible, Conditionally Disabled) */}
                                    <form.Field
                                        name="code"
                                        validators={{
                                            onChange: z
                                                .string()
                                                .length(
                                                    10,
                                                    "Code must be exactly 10 characters"
                                                )
                                                .or(z.literal("")),
                                        }}
                                        children={(field) => (
                                            <div className="group space-y-2">
                                                <label
                                                    className={cn(
                                                        "font-mona-sans text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-500",
                                                        codeSent
                                                            ? "text-zinc-500"
                                                            : "text-zinc-300"
                                                    )}
                                                >
                                                    One-Time Code
                                                </label>
                                                <input
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value
                                                        )
                                                    }
                                                    maxLength={10}
                                                    // autoComplete="one-time-code"
                                                    disabled={!codeSent}
                                                    className={cn(
                                                        "w-full border-b-2 bg-transparent py-3 font-mono text-lg font-medium tracking-[6px] uppercase transition-all duration-500 outline-none",
                                                        !codeSent
                                                            ? "border-zinc-100 text-zinc-300 placeholder:text-zinc-200"
                                                            : "border-zinc-200 text-zinc-900 focus:border-zinc-900 focus:placeholder:opacity-0",
                                                        field.state.meta.errors
                                                            .length > 0 &&
                                                            field.state.value
                                                                ?.length === 10
                                                            ? "border-red-500 text-red-500"
                                                            : ""
                                                    )}
                                                    placeholder="••••••••••"
                                                />
                                                <div className="h-4">
                                                    {field.state.meta.errors
                                                        .length > 0 &&
                                                        field.state.value
                                                            ?.length === 10 && (
                                                            <p className="text-[10px] font-bold text-red-500 uppercase">
                                                                {(
                                                                    field.state
                                                                        .meta
                                                                        .errors[0] as any
                                                                )?.message ??
                                                                    field.state
                                                                        .meta
                                                                        .errors[0]}
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* Submit Button */}
                                <form.Subscribe
                                    selector={(state) => ({
                                        canSubmit: state.canSubmit,
                                        isSubmitting: state.isSubmitting,
                                        code: state.values.code,
                                    })}
                                >
                                    {(state) => (
                                        <button
                                            type="submit"
                                            disabled={
                                                !state.canSubmit ||
                                                state.isSubmitting ||
                                                state.code.length !== 10
                                            }
                                            className={cn(
                                                "font-mona-sans w-full rounded-full py-5 text-lg font-medium tracking-wider transition-all duration-300",
                                                !state.canSubmit ||
                                                    state.isSubmitting ||
                                                    state.code.length !== 10
                                                    ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-300"
                                                    : "cursor-pointer bg-zinc-900 text-white hover:bg-zinc-700 active:bg-zinc-900"
                                            )}
                                        >
                                            {state.isSubmitting ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                                    <span>
                                                        Verifying Access
                                                    </span>
                                                </div>
                                            ) : (
                                                "Lets fkin gooo!"
                                            )}
                                        </button>
                                    )}
                                </form.Subscribe>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between">
                    <p className="font-mona-sans text-md font-medium text-zinc-900">
                        Branding this page soon.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthorisationNeededPage;
