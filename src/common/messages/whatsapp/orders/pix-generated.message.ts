import { NumbersHelper } from "src/common/helpers/number.helper";

export const MW_OrderPixGenerated = (customerName: string, totalValue: number): string => {

  const message = `🌭 *Dogão do Pastor*\n\nOlá ${customerName}! Seu pedido está quase lá.\n\nPara finalizar, efetue o pagamento do PIX no valor de *${NumbersHelper.formatCurrency(totalValue)}*.\n\nCopie o código abaixo e cole no aplicativo do seu banco:\n\n👇👇👇👇👇👇`;

  return message;
};
