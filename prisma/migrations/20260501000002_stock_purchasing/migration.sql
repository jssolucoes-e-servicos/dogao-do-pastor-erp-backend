-- Migration: stock_purchasing
-- Módulo de Compras e Estoque

CREATE TYPE "StockMovementTypeEnum" AS ENUM (
  'PURCHASE_IN', 'PRODUCTION_OUT', 'SURPLUS_DONATE', 'SURPLUS_SELL', 'SURPLUS_DISCARD', 'ADJUSTMENT'
);

CREATE TABLE IF NOT EXISTS "stock_products" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "unit"        TEXT NOT NULL,
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   TIMESTAMP(3),
  CONSTRAINT "stock_products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_products_name_key" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id"           TEXT NOT NULL,
  "editionId"    TEXT NOT NULL,
  "supplierName" TEXT,
  "notes"        TEXT,
  "totalValue"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "orderedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt"  TIMESTAMP(3),
  "createdById"  TEXT,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"    TIMESTAMP(3),
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_orders_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id"              TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "productId"       TEXT NOT NULL,
  "quantity"        DOUBLE PRECISION NOT NULL,
  "unitPrice"       DOUBLE PRECISION NOT NULL,
  "totalPrice"      DOUBLE PRECISION NOT NULL,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "stock_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id"          TEXT NOT NULL,
  "productId"   TEXT NOT NULL,
  "editionId"   TEXT NOT NULL,
  "type"        "StockMovementTypeEnum" NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL,
  "notes"       TEXT,
  "createdById" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"   TIMESTAMP(3),
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "stock_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "stock_movements_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "purchase_orders_editionId_idx" ON "purchase_orders"("editionId");
CREATE INDEX IF NOT EXISTS "purchase_items_purchaseOrderId_productId_idx" ON "purchase_items"("purchaseOrderId", "productId");
CREATE INDEX IF NOT EXISTS "stock_movements_productId_editionId_type_idx" ON "stock_movements"("productId", "editionId", "type");

-- Produtos padrão
INSERT INTO "stock_products" ("id", "name", "unit", "description", "active", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Salsicha', 'kg', 'Salsicha para hot dog', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Pão de Hot Dog', 'unidade', 'Pão para hot dog', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Embalagem', 'unidade', 'Embalagem para hot dog', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Ketchup', 'kg', 'Ketchup', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Mostarda', 'kg', 'Mostarda', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Maionese', 'kg', 'Maionese', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Milho', 'kg', 'Milho em conserva', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Batata Palha', 'kg', 'Batata palha', true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
