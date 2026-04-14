-- Migration: permission_system fase 1
-- Adiciona slug a modules, dashboard_cards a roles, e cria controls, control_permissions, system_configs

-- 1. Adicionar slug (nullable por enquanto) à tabela modules
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- 2. Adicionar dashboard_cards à tabela roles
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "dashboard_cards" TEXT[] NOT NULL DEFAULT '{}';

-- 3. Criar tabela controls
CREATE TABLE IF NOT EXISTS "controls" (
  "id"          TEXT NOT NULL,
  "module_id"   TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"  TIMESTAMP(3),
  CONSTRAINT "controls_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "controls_slug_key" UNIQUE ("slug"),
  CONSTRAINT "controls_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Criar tabela control_permissions
CREATE TABLE IF NOT EXISTS "control_permissions" (
  "id"             TEXT NOT NULL,
  "control_id"     TEXT NOT NULL,
  "contributor_id" TEXT,
  "role_id"        TEXT,
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"     TIMESTAMP(3),
  CONSTRAINT "control_permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "control_permissions_control_contributor_key" UNIQUE ("control_id", "contributor_id"),
  CONSTRAINT "control_permissions_control_role_key" UNIQUE ("control_id", "role_id"),
  CONSTRAINT "control_permissions_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "control_permissions_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "contributors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "control_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Criar tabela system_configs
CREATE TABLE IF NOT EXISTS "system_configs" (
  "id"          TEXT NOT NULL,
  "key"         TEXT NOT NULL,
  "value"       TEXT NOT NULL,
  "description" TEXT,
  "updated_by"  TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "system_configs_key_key" UNIQUE ("key")
);

-- 6. Índices
CREATE INDEX IF NOT EXISTS "controls_module_id_idx" ON "controls"("module_id");
CREATE INDEX IF NOT EXISTS "control_permissions_control_id_idx" ON "control_permissions"("control_id");
