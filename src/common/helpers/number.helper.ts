type NormalizePhoneProp = {
  area_code: string;
  number: string;
};
export class NumbersHelper {
  static normalizePhone(phoneRaw: string): NormalizePhoneProp {
    // Remove tudo que não é número
    const digits = phoneRaw.replace(/\D/g, '');
    const area_code = digits.length > 2 ? digits.slice(0, 2) : '00';
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
}
