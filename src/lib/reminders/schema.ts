import { z } from "zod";

export const reminderLocaleSchema = z.enum(["zh-CN", "en"]);
export const subscriberStatusSchema = z.enum(["pending_verify", "active", "unsubscribed"]);

export type ReminderLocale = z.infer<typeof reminderLocaleSchema>;
export type SubscriberStatus = z.infer<typeof subscriberStatusSchema>;

export const sendCodeBodySchema = z.object({
  email: z.string(),
  locale: reminderLocaleSchema,
  consent: z.literal(true),
});

export const verifyBodySchema = z.object({
  email: z.string(),
  code: z.string(),
});

export const unsubscribeBodySchema = z.object({
  email: z.string(),
});

export type SendCodeBody = z.infer<typeof sendCodeBodySchema>;
export type VerifyBody = z.infer<typeof verifyBodySchema>;
