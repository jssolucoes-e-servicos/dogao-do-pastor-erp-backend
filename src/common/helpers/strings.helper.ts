import { PaymentMethodEnum } from "../enums";

type SplitNameProp = {
  first_name: string;
  last_name: string;
};

export class StringsHelper {
  static splitName(fullName?: string): SplitNameProp {
    const name = (fullName ?? '').trim();
    if (!name) return { first_name: 'Cliente', last_name: 'SmartChurch' };
    const parts = name.split(/\s+/);
    const first_name = parts.shift() || 'Cliente';
    const last_name = parts.join(' ') || 'SmartChurch';
    return { first_name, last_name };
  }

  static emailFallback(preorderId: string, existing?: string | null): string {
    if (existing && /\S+@\S+\.\S+/.test(existing)) return existing;
    return `noemail+${preorderId}@smartchurches.com.br`;
  }

  static translatePaymentMethod(method: PaymentMethodEnum): string {
    const TRANSLATE: Partial<Record<PaymentMethodEnum, string>> = {
      [PaymentMethodEnum.PIX]: 'PIX',
      [PaymentMethodEnum.CARD]: 'Cartão',
      [PaymentMethodEnum.CARD_CREDIT]: 'Cartão de Crédito',
      [PaymentMethodEnum.CARD_DEBIT]: 'Cartão de Débito',
      [PaymentMethodEnum.MONEY]: 'Dinheiro',
      [PaymentMethodEnum.POS]: 'Maquininha',
      [PaymentMethodEnum.PIX_OFFLINE]: 'PIX',
      [PaymentMethodEnum.TICKET]: 'Ticket',
      [PaymentMethodEnum.UNDEFINED]: '—',
    };
    return TRANSLATE[method] ?? method ?? '—';
  }
}
