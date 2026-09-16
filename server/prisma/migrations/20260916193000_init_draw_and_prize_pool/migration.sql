-- CreateEnum
CREATE TYPE "DrawStrategy" AS ENUM ('RANDOM', 'SCORE_WEIGHTED');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAFT', 'SIMULATED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PrizeTier" AS ENUM ('THREE', 'FOUR', 'FIVE');

-- CreateTable
CREATE TABLE "draws" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "strategy" "DrawStrategy" NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAFT',
    "winningNumbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "simulationResult" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_entries" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numbers" INTEGER[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_pools" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "matchType" "PrizeTier" NOT NULL,
    "percentage" INTEGER NOT NULL,
    "poolAmount" INTEGER NOT NULL,
    "rolloverAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_winners" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchType" "PrizeTier" NOT NULL,
    "prizeAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draws_month_year_key" ON "draws"("month", "year");

-- CreateIndex
CREATE INDEX "draws_status_idx" ON "draws"("status");

-- CreateIndex
CREATE UNIQUE INDEX "draw_entries_drawId_userId_key" ON "draw_entries"("drawId", "userId");

-- CreateIndex
CREATE INDEX "draw_entries_drawId_idx" ON "draw_entries"("drawId");

-- CreateIndex
CREATE INDEX "draw_entries_userId_idx" ON "draw_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "prize_pools_drawId_matchType_key" ON "prize_pools"("drawId", "matchType");

-- CreateIndex
CREATE INDEX "prize_pools_drawId_idx" ON "prize_pools"("drawId");

-- CreateIndex
CREATE INDEX "draw_winners_drawId_idx" ON "draw_winners"("drawId");

-- CreateIndex
CREATE INDEX "draw_winners_userId_idx" ON "draw_winners"("userId");

-- AddForeignKey
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_pools" ADD CONSTRAINT "prize_pools_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_winners" ADD CONSTRAINT "draw_winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
