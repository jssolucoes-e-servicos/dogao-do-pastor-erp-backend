//src/common/types/log-methods.type.ts
import { LoggerService } from 'src/modules/logger/services/logger.service';
export type LogMethodsType = Omit<
  LoggerService,
  'setLog' | 'setWarn' | 'setError'
> & {
  log: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};
