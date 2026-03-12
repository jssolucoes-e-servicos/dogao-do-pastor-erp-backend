import { NumbersHelper } from "src/common/helpers/number.helper";

export const MW_OrderCardGenerated = (customerName: string, totalValue: number, paymentLink: string): string => {
  const message = `🌭 *Dogão do Pastor*\n\nOlá ${customerName}! Seu pedido está quase lá.
                  \n\nPara processar o pagamento do seu pedido no valor de *${NumbersHelper.formatCurrency(totalValue)}* de forma segura, acesse o link abaixo:
                  \n\n👇👇👇👇👇👇
                  ${paymentLink}
                  \n\n_Assim que o pagamento for confirmado, prepararemos o seu Dogão!_`;

  return message;
};
