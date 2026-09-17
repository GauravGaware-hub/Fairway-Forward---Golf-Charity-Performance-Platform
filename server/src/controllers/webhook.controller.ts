import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service.js";

export async function handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;

  try {
    const result = await SubscriptionService.handleRazorpayWebhook(
      req.body,
      signature
    );

    res.status(200).json({
      received: true,
      idempotent: result.idempotent,
      eventType: result.eventType,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    const isSignatureError = message.includes("Signature Verification Failed");

    res.status(isSignatureError ? 400 : 500).json({
      success: false,
      error: {
        code: isSignatureError
          ? "RAZORPAY_WEBHOOK_SIGNATURE_INVALID"
          : "RAZORPAY_WEBHOOK_PROCESSING_ERROR",
        message,
      },
    });
  }
}
