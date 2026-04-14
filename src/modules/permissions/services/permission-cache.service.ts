import { Injectable } from '@nestjs/common';
import { EffectivePermissions } from '../interfaces/effective-permissions.interface';

const TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry {
  data: EffectivePermissions;
  expiresAt: number;
}

@Injectable()
export class PermissionCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(contributorId: string): EffectivePermissions | null {
    const entry = this.cache.get(contributorId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(contributorId);
      return null;
    }
    return entry.data;
  }

  set(contributorId: string, perms: EffectivePermissions): void {
    this.cache.set(contributorId, {
      data: perms,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  invalidate(contributorId: string): void {
    this.cache.delete(contributorId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
