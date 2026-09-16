import { z } from 'zod';

export const uploadProofSchema = z.object({
  proofImage: z.string().min(10, 'Proof image payload is required'),
  mimeType: z
    .string()
    .refine(
      (val) => ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(val.toLowerCase()),
      { message: 'Invalid image mimeType. Allowed: image/png, image/jpeg, image/jpg, image/webp' }
    ),
});

export const rejectProofSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters long'),
});

export const markPaidSchema = z.object({
  paymentReference: z.string().trim().optional(),
});

export type UploadProofInput = z.infer<typeof uploadProofSchema>;
export type RejectProofInput = z.infer<typeof rejectProofSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
