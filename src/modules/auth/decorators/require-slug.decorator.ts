import { SetMetadata } from '@nestjs/common';

/**
 * Protege uma rota pelo slug de módulo do sistema de permissões.
 * Usa o mesmo sistema que o ERP usa no frontend.
 *
 * Exemplo:
 *   @RequireSlug('erp.my-cell')
 *   async inviteMember(...) {}
 *
 * Aceita múltiplos slugs (OR lógico — basta ter acesso a qualquer um):
 *   @RequireSlug('erp.my-cell', 'erp.admin')
 */
export const RequireSlug = (...slugs: string[]) => SetMetadata('required_slugs', slugs);
