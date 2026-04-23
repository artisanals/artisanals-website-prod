"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Form validation schema
const formSchema = z.object({
    personnelKey: z.string().min(1, "Personnel Key is required"),
    email: z.email("Invalid email address"),
    code: z
        .string()
        .length(10, "Code must be exactly 10 characters")
        .or(z.literal("")),
});

const STORAGE_KEY = "artisanals_admin_auth_progress";

const AuthorisationNeededPage = () => {
    const [codeSent, setCodeSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            personnelKey: "",
            email: "",
            code: "",
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            // Simulating API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            console.log("Form submitted successfully:", value);
            setIsSubmitting(false);
            // Clear localStorage on success
            localStorage.removeItem(STORAGE_KEY);
        },
    });

    // Restore state from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.personnelKey)
                    form.setFieldValue("personnelKey", parsed.personnelKey);
                if (parsed.email) form.setFieldValue("email", parsed.email);
                if (parsed.code) form.setFieldValue("code", parsed.code);
                if (parsed.codeSent) setCodeSent(true);
            } catch (err) {
                console.error("Failed to restore form state:", err);
            }
        }
    }, [form]);

    // Save state to localStorage on changes
    useEffect(() => {
        const values = form.state.values;
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                ...values,
                codeSent,
            })
        );
    }, [form.state.values, codeSent]);

    const handleSendCode = async () => {
        const personnelKey = form.getFieldValue("personnelKey");
        const email = form.getFieldValue("email");

        // Simple validation check before "sending"
        if (personnelKey && email && email.includes("@")) {
            setCodeSent(true);
        } else {
            // Trigger validation to show errors
            form.validateAllFields("change");
        }
    };

    return (
        <div className="bg-dotted no-scrollbar flex h-screen w-screen flex-col justify-between overflow-x-hidden px-12 py-8">
            <div className="flex justify-between">
                <p className="font-mona-sans text-md font-medium text-zinc-900">
                    artisanals
                </p>
            </div>

            <div className="flex flex-col gap-y-10">
                <div className="space-y-6">
                    <p className="font-mona-sans leading-[115%] font-medium tracking-tight text-zinc-900 text-[68px]">
                        Yo, admin pages are gated.
                    </p>

                    <p className="font-mona-sans leading-[115%] font-medium text-zinc-900 text-xl">
                        Let&apos;s verify your identity with your Personnel Key and a
                        one-time code.
                    </p>
                </div>

                <div className="w-full mt-10">
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
                                children={(field) => (
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                                            Personnel Key
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
                                            autoComplete="off"
                                            className={cn(
                                                "w-full border-b-2 border-zinc-200 bg-transparent py-3 text-2xl font-medium transition-all duration-500 outline-none",
                                                "focus:border-zinc-900 focus:placeholder:opacity-0",
                                                field.state.meta.errors.length >
                                                    0
                                                    ? "border-red-500 text-red-500"
                                                    : "text-zinc-900"
                                            )}
                                            placeholder="PK-000-000"
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">
                                                {(
                                                    field.state.meta
                                                        .errors[0] as any
                                                )?.message ??
                                                    field.state.meta.errors[0]}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            {/* Email Field */}
                            <form.Field
                                name="email"
                                children={(field) => (
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                                            Email Address
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
                                            type="email"
                                            autoComplete="email"
                                            className={cn(
                                                "w-full border-b-2 border-zinc-200 bg-transparent py-3 text-2xl font-medium transition-all duration-500 outline-none",
                                                "focus:border-zinc-900 focus:placeholder:opacity-0",
                                                field.state.meta.errors.length >
                                                    0
                                                    ? "border-red-500 text-red-500"
                                                    : "text-zinc-900"
                                            )}
                                            placeholder="admin@artisanals.com"
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <p className="text-[10px] font-bold text-red-500 uppercase">
                                                {(
                                                    field.state.meta
                                                        .errors[0] as any
                                                )?.message ??
                                                    field.state.meta.errors[0]}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Send Code Button */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={codeSent}
                                className={cn(
                                    "relative h-12 overflow-hidden rounded-full px-8 text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500",
                                    codeSent
                                        ? "cursor-default bg-zinc-100 text-zinc-400"
                                        : "bg-zinc-900 text-white shadow-xl shadow-zinc-200 hover:bg-black hover:shadow-2xl active:scale-95"
                                )}
                            >
                                <span className="relative z-10">
                                    {codeSent
                                        ? "Verification Sent"
                                        : "Request Code"}
                                </span>
                                {!codeSent && (
                                    <div className="absolute inset-0 bg-white/20" />
                                )}
                            </button>
                            {codeSent && (
                                <button
                                    onClick={() => setCodeSent(false)}
                                    className="text-[10px] font-bold text-zinc-400 uppercase transition-colors hover:text-zinc-900"
                                >
                                    Resend?
                                </button>
                            )}
                        </div>

                        {/* Code Field (Revealed and enabled after code sent) */}
                        <AnimatePresence>
                            {codeSent && (
                                <div className="overflow-hidden">
                                    <form.Field
                                        name="code"
                                        children={(field) => (
                                            <div className="group space-y-4 pt-4">
                                                <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-900 uppercase">
                                                    Enter 10-Character Code
                                                    <span className="h-1 w-1 rounded-full bg-zinc-900" />
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
                                                    autoComplete="one-time-code"
                                                    className={cn(
                                                        "w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-6 text-center font-mono text-4xl tracking-[0.3em] transition-all duration-500 outline-none",
                                                        "focus:border-zinc-900 focus:bg-white focus:shadow-2xl focus:shadow-zinc-100",
                                                        field.state.meta.errors
                                                            .length > 0 &&
                                                            field.state.value
                                                                ?.length === 10
                                                            ? "border-red-500 text-red-500"
                                                            : "text-zinc-900"
                                                    )}
                                                    placeholder="••••••••••"
                                                />
                                            </div>
                                        )}
                                    />
                                </div>
                            )}
                        </AnimatePresence>

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
                                        "w-full rounded-2xl py-6 text-sm font-black tracking-[0.3em] uppercase transition-all duration-700",
                                        !state.canSubmit ||
                                            state.isSubmitting ||
                                            state.code.length !== 10
                                            ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-300"
                                            : "bg-zinc-900 text-white shadow-2xl shadow-zinc-300 hover:-translate-y-1 hover:bg-black active:scale-95"
                                    )}
                                >
                                    {state.isSubmitting ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                            <span>Verifying Access</span>
                                        </div>
                                    ) : (
                                        "Authenticate"
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
    );
};

export default AuthorisationNeededPage;
