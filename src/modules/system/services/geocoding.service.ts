import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private isProcessing = false; // Trava para evitar execuções simultâneas

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Geocodifica um endereço usando OpenStreetMap (Nominatim)
   */
  async geocodeAddress(addressId: string): Promise<{ lat: number; lng: number } | null> {
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) return null;

    // LIMPEZA E NORMALIZAÇÃO DO ENDEREÇO
    let streetClean = address.street;
    let neighborhood = address.neighborhood;
    let city = address.city;
    let state = address.state;
    let number = address.number;

    // 1. Fallback para campos vazios ou com '-'
    if (!neighborhood || neighborhood === '-') neighborhood = 'Restinga';
    if (!city || city === '-') city = 'Porto Alegre';
    if (!state || state === '-') state = 'RS';

    // 2. Tenta extrair o número se ele for inválido
    if (!number || number === '-' || number === 's/n') {
      const extractedNumber = streetClean.match(/\d+/);
      if (extractedNumber) {
        number = extractedNumber[0];
        // Remove o número encontrado da rua para não duplicar na query
        streetClean = streetClean.replace(number, '').trim();
      } else {
        number = 's/n';
      }
    }

    // 3. Limpa complementos da rua
    streetClean = streetClean.replace(/(,\s*)?(bloco|ap|apartamento|casa|frente|fundos|lote|quadra|sala|lj|loja).*/gi, '');
    
    // 4. Limpa prefixos de acesso
    streetClean = streetClean.replace(/^(acesso|beco|entrada|passagem|servid\u00e3o|viela)\s+[a-z0-9]\b/gi, '');

    const fullAddress = `${streetClean}, ${number}, ${neighborhood}, ${city}, ${state}, Brazil`;
    
    try {
      this.logger.log(`[GEO] [${addressId}] Buscando: ${fullAddress}`);
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
      const response = await fetch(url, { 
        headers: { 
          'User-Agent': 'DogaoDoPastor-ERP-Logistics/1.1 (contato@igrejavivaemcelulas.com.br)',
          'Accept': 'application/json'
        } 
      });

      if (!response.ok) {
        this.logger.error(`[GEO] Nominatim retornou erro HTTP: ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.logger.warn(`[GEO] Resposta não é JSON (Bloqueio ou Erro). Pulando.`);
        return null;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };

        await this.prisma.customerAddress.update({
          where: { id: addressId },
          data: coordinates,
        });

        this.logger.log(`[GEO] ✅ LOCALIZADO: ${lat}, ${lon}`);
        return coordinates;
      }

      // TENTATIVA 2: Se não achou a rua, tenta por Bairro + Número
      this.logger.warn(`[GEO] Rua não encontrada. Tentando por Bairro + Número...`);
      const fallbackQuery = `${address.number}, ${neighborhood}, ${city}, ${state}, Brazil`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`;
      const fallbackRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'DogaoDoPastor-ERP-Logistics/1.1' } });
      const fallbackData = await fallbackRes.json();

      if (fallbackData && fallbackData.length > 0) {
        const { lat, lon } = fallbackData[0];
        const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };
        await this.prisma.customerAddress.update({ where: { id: addressId }, data: coordinates });
        this.logger.log(`[GEO] ✅ LOCALIZADO POR BAIRRO: ${lat}, ${lon}`);
        return coordinates;
      }

      // Fallback ultra-simples: Apenas Cidade e Estado
      this.logger.warn(`[GEO] Não achou endereço exato. Tentando fallback municipal...`);
      const cityUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.city + ', Brazil')}&limit=1`;
      const cityRes = await fetch(cityUrl, { headers: { 'User-Agent': 'DogaoDoPastor-ERP-Logistics/1.1' } });
      const cityData = await cityRes.json();
      
      if (cityData && cityData.length > 0) {
        this.logger.log(`[GEO] 📍 Localizado por cidade como aproximação.`);
        // Não salvamos no banco para não sujar o GPS real, mas retornamos para o mapa não ficar vazio
        return { lat: parseFloat(cityData[0].lat), lng: parseFloat(cityData[0].lon) };
      }

      return null;
    } catch (error) {
      this.logger.error(`[GEO] 💥 Erro crítico: ${error.message}`);
      return null;
    }
  }

  /**
   * Geocodifica todos os endereços que ainda não possuem lat/lng
   */
  async geocodePending(): Promise<number> {
    if (this.isProcessing) {
      this.logger.warn('[GEO] Já existe um processo de geocoding em curso. Ignorando chamada.');
      return 0;
    }

    this.isProcessing = true;
    try {
      const pending = await this.prisma.customerAddress.findMany({
        where: {
          OR: [{ lat: null }, { lng: null }],
          active: true,
        },
        take: 10, // Diminuindo o lote para ser mais gentil com a API
      });

      if (pending.length === 0) return 0;

      this.logger.log(`[GEO] Iniciando lote de ${pending.length} endereços.`);

      let count = 0;
      for (const address of pending) {
        const result = await this.geocodeAddress(address.id);
        if (result) count++;
        
        // Delay de 1.5 segundos (mais seguro que 1s)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      return count;
    } finally {
      this.isProcessing = false;
    }
  }
}
