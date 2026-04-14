import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CONTROL_KEY = 'require_control';

export const RequireControl = (slug: string) =>
  SetMetadata(REQUIRE_CONTROL_KEY, slug);
