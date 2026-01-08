import { z } from 'zod';

/**
 * Payment methods enum for validation
 */
const paymentMethodSchema = z.enum(['dinheiro', 'pix', 'credito', 'debito']);

/**
 * Cash closing line validation schema
 */
export const cashClosingLineSchema = z.object({
    payment_method: paymentMethodSchema,
    system_amount: z
        .number()
        .min(0, 'Valor do sistema não pode ser negativo'),
    real_amount: z
        .number()
        .min(0, 'Valor real não pode ser negativo'),
    justification: z.string().optional(),
});

export type CashClosingLineFormData = z.infer<typeof cashClosingLineSchema>;

/**
 * Submit closing form validation schema
 */
export const submitClosingSchema = z.object({
    lines: z
        .array(cashClosingLineSchema)
        .min(1, 'Adicione pelo menos uma forma de pagamento'),
}).refine(
    (data) => {
        // Check if divergent lines have justifications
        return data.lines.every((line) => {
            const hasDivergence = Math.abs(line.real_amount - line.system_amount) > 0.01;
            if (hasDivergence) {
                return line.justification && line.justification.trim().length >= 10;
            }
            return true;
        });
    },
    {
        message: 'Linhas com divergência precisam de justificativa (mínimo 10 caracteres)',
        path: ['lines'],
    }
);

export type SubmitClosingFormData = z.infer<typeof submitClosingSchema>;

/**
 * Reject closing form validation schema
 */
export const rejectClosingSchema = z.object({
    reason: z
        .string()
        .min(10, 'Motivo da rejeição deve ter pelo menos 10 caracteres')
        .max(500, 'Motivo da rejeição deve ter no máximo 500 caracteres'),
});

export type RejectClosingFormData = z.infer<typeof rejectClosingSchema>;

/**
 * Approve closing form validation schema
 */
export const approveClosingSchema = z.object({
    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional(),
});

export type ApproveClosingFormData = z.infer<typeof approveClosingSchema>;
