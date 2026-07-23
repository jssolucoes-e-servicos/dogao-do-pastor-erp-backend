import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map, switchMap, finalize } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../services/logger.service';

@Controller('admin/logs')
export class LoggerController {
  constructor(private readonly appLogger: LoggerService) { }

  private getTodayLogFilePath(): string {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // Retorna YYYY-MM-DD no fuso de SP
    return path.join(process.cwd(), 'logs', `application-${today}.log`);
  }

  /**
   * 1. Retorna o histórico recente de logs para carregar ao abrir a página
   */
  @Get()
  getHistoricalLogs(@Query('limit') limit = 100, @Query('level') level?: string) {
    const filePath = this.getTodayLogFilePath();

    if (!fs.existsSync(filePath)) {
      this.appLogger.warn(`Arquivo de logs não encontrado no caminho esperado: ${filePath}`, 'LoggerController');
      return [];
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(Boolean);

      let parsedLogs = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, level: 'info', timestamp: new Date().toISOString() };
        }
      });

      if (level) {
        parsedLogs = parsedLogs.filter((log) => log.level === level);
      }

      return parsedLogs.slice(-Number(limit));
    } catch (error) {
      this.appLogger.error('Erro ao ler arquivo de logs diários', error.stack, 'LoggerController');
      return [];
    }
  }

  /**
   * 2. Stream de Logs em Tempo Real via SSE (Server-Sent Events)
   */
  @Sse('stream')
  streamLogs(): Observable<MessageEvent> {
    const filePath = this.getTodayLogFilePath();
    let lastSize = 0;

    if (fs.existsSync(filePath)) {
      lastSize = fs.statSync(filePath).size;
    }

    this.appLogger.log('📺 Um usuário conectou-se ao Stream de Logs em tempo real', 'LoggerController');

    return interval(1000).pipe(
      map(() => {
        const currentPath = this.getTodayLogFilePath();

        if (!fs.existsSync(currentPath)) {
          return { data: [] };
        }

        const stats = fs.statSync(currentPath);

        // Se o arquivo sofrer rotação, reseta o leitor
        if (stats.size < lastSize) {
          lastSize = 0;
        }

        if (stats.size > lastSize) {
          const stream = fs.createReadStream(currentPath, {
            start: lastSize,
            end: stats.size,
          });

          lastSize = stats.size;

          return new Promise((resolve) => {
            stream.on('data', (chunk) => {
              const lines = chunk.toString().split('\n').filter(Boolean);
              const parsed = lines.map((line) => {
                try {
                  return JSON.parse(line);
                } catch {
                  return { message: line, level: 'info', timestamp: new Date().toISOString() };
                }
              });
              resolve({ data: parsed });
            });
          });
        }

        return { data: [] };
      }),
      switchMap((promise) => promise as Promise<MessageEvent>),
      // Detecta quando a conexão é encerrada (tab fechada, navegação para outra página, etc)
      finalize(() => {
        this.appLogger.log('🔌 Um usuário desconectou-se do Stream de Logs', 'LoggerController');
      })
    );
  }
}
