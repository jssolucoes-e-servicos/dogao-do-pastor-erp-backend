-- CreateEnum
CREATE TYPE "NotificationTypeEnum" AS ENUM ('SYSTEM', 'SALES', 'ORDERS', 'RANKING', 'CELL', 'NETWORK');

-- CreateTable: push_tokens
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");
CREATE INDEX "push_tokens_contributorId_idx" ON "push_tokens"("contributorId");
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: notification_preferences
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "sales" BOOLEAN NOT NULL DEFAULT true,
    "orders" BOOLEAN NOT NULL DEFAULT true,
    "ranking" BOOLEAN NOT NULL DEFAULT true,
    "cell" BOOLEAN NOT NULL DEFAULT true,
    "network" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_contributorId_key" ON "notification_preferences"("contributorId");
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: notification_logs
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT,
    "type" "NotificationTypeEnum" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notification_logs_contributorId_type_idx" ON "notification_logs"("contributorId", "type");
