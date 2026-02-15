import { StringValidator } from "src/common/validators";

export class inviteSendWhatsappDTO {
  @StringValidator({
    fieldName: 'destination',
    label: 'Número de destino',
  })
  destination: string;

  @StringValidator({
    fieldName: 'inviteId',
    label: 'ID do convite',
  })
  inviteId: string;
}
