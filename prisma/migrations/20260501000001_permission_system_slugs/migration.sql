-- Migration: permission_system fase 2
-- Popular slugs nos módulos existentes e adicionar constraint NOT NULL

-- 1. Popular slugs baseado no campo ctrl/page existente
UPDATE "modules" SET "slug" = 'erp.dashboard'    WHERE "ctrl" ILIKE '%dashboard%'    AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.pdv'          WHERE "ctrl" ILIKE '%pdv%'          AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.pedidos'      WHERE "ctrl" ILIKE '%pedido%'       AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.clientes'     WHERE "ctrl" ILIKE '%cliente%'      AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.doacoes'      WHERE "ctrl" ILIKE '%doac%'         AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.parceiros'    WHERE "ctrl" ILIKE '%parceiro%'     AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.retiradas'    WHERE "ctrl" ILIKE '%retirada%'     AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.comandas'     WHERE "ctrl" ILIKE '%comanda%'      AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.producao'     WHERE "ctrl" ILIKE '%producao%'     AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.entregas'     WHERE "ctrl" ILIKE '%entrega%'      AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.colaboradores' WHERE "ctrl" ILIKE '%colaborador%' AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.vendedores'   WHERE "ctrl" ILIKE '%vendedor%'     AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.celulas'      WHERE "ctrl" ILIKE '%celula%'       AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.configuracoes' WHERE "ctrl" ILIKE '%config%'      AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.edicoes'      WHERE "ctrl" ILIKE '%edicao%'       AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.sorteio'      WHERE "ctrl" ILIKE '%sorteio%'      AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.perfis'       WHERE "ctrl" ILIKE '%perfil%'       AND "slug" IS NULL;
UPDATE "modules" SET "slug" = 'erp.permissoes'   WHERE "ctrl" ILIKE '%permiss%'      AND "slug" IS NULL;

-- Fallback: módulos sem slug recebem slug baseado no id
UPDATE "modules" SET "slug" = 'erp.modulo-' || LOWER(REPLACE("id", ' ', '-'))
WHERE "slug" IS NULL;

-- 2. Adicionar constraint NOT NULL ao slug
ALTER TABLE "modules" ALTER COLUMN "slug" SET NOT NULL;

-- 3. Adicionar índice único (se não existir via constraint)
CREATE UNIQUE INDEX IF NOT EXISTS "modules_slug_key" ON "modules"("slug");

-- 4. Inserir configuração inicial do PDV (desabilitado por padrão)
INSERT INTO "system_configs" ("id", "key", "value", "description", "created_at", "updated_at")
VALUES (
  gen_random_uuid()::text,
  'pdv_enabled',
  'false',
  'Habilita ou desabilita o módulo PDV. Deve ser ativado manualmente no dia de produção.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
