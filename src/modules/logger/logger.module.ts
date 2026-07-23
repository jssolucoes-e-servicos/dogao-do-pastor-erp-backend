import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerOptions } from './configs/logger.config';
import { LoggerService } from './services/logger.service';
import { LoggerController } from './controllers/logger.controller';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot(loggerOptions),
    ],
    controllers: [LoggerController],
    providers: [LoggerService],
    exports: [LoggerService],
})
export class LoggerModule { }
