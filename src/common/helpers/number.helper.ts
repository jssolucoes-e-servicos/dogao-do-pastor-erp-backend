type NormalizePhoneProp = {
  area_code: string;
  number: string;
};
export class NumbersHelper {
  static normalizePhone(phoneRaw?: string | null): NormalizePhoneProp {
    if (!phoneRaw) {
      return { area_code: '11', number: '999999999' };
    }
    // Remove tudo que não é número
    let digits = phoneRaw.replace(/\D/g, '');
    
    // Remove DDI 55 preventivamente se presente
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    }
    
    const area_code = digits.length > 2 ? digits.slice(0, 2) : '11';
    const number =
      digits.length > 2 ? digits.slice(2) : digits.padStart(9, '0');
    return { area_code, number };
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  static formatCurrencyNoSymbol(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
