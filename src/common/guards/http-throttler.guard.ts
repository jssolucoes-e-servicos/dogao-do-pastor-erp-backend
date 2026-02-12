import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    // 👉 Se NÃO for HTTP, libera
    if (context.getType() !== 'http') {
      return Promise.resolve(true);
    }

    // 👉 Se for HTTP, aplica throttle normal
    return super.canActivate(context);
  }
}
