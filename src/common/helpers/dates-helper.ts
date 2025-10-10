export class DatesHelper {
  static IsPromoDate(): boolean {
    // 1. Defina a data limite (10/11/2025)
    // Lembre-se: no construtor Date(ano, mês, dia, hora, minuto, segundo, milissegundo),
    // o mês 10 corresponde a Novembro.
    const diaLimite = 10;
    const mesLimite = 10; // Novembro (10-1)
    const anoLimite = 2025;
    const horaFinalDoDia = 23;
    const minutoFinalDoDia = 59;
    const segundoFinalDoDia = 59;
    const milissegundoFinalDoDia = 999;

    const limitDate: Date = new Date(
      anoLimite,
      mesLimite,
      diaLimite,
      horaFinalDoDia,
      minutoFinalDoDia,
      segundoFinalDoDia,
      milissegundoFinalDoDia,
    );

    const currentDate: Date = new Date();
    const isPromo: boolean = currentDate <= limitDate;
    //console.log(`Data atual: ${currentDate.toLocaleString('pt-BR')}`);
    // console.log(`Data limite: ${limitDate.toLocaleString('pt-BR')}`);
    //  console.log(`A promoção está ativa? ${isPromo}`);
    return isPromo;
  }
}
