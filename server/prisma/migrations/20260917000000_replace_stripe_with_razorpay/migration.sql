-- AlterTable
ALTER TABLE "subscriptions" RENAME COLUMN "stripeCustomerId" TO "providerCustomerId";
ALTER TABLE "subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "providerSubscriptionId";

-- AlterIndex
ALTER INDEX "subscriptions_stripeCustomerId_idx" RENAME TO "subscriptions_providerCustomerId_idx";
ALTER INDEX "subscriptions_stripeSubscriptionId_key" RENAME TO "subscriptions_providerSubscriptionId_key";

-- AlterTable
ALTER TABLE "webhook_events" RENAME COLUMN "stripeEventId" TO "eventId";

-- AlterIndex
ALTER INDEX "webhook_events_stripeEventId_idx" RENAME TO "webhook_events_eventId_idx";
ALTER INDEX "webhook_events_stripeEventId_key" RENAME TO "webhook_events_eventId_key";
