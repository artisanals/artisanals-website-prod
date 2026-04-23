import z from "zod";

// Form validation schema
export const adminFormSchema = z.object({
    personnelKey: z.string().min(1, "Personnel Key is required"),
    email: z.email("Invalid email address"),
    code: z
        .string()
        .length(10, "Code must be exactly 10 characters")
        .or(z.literal("")),
});
