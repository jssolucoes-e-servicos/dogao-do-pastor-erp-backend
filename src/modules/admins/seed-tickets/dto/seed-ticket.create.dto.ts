import { NumberValidator } from "src/common/validators";

export class SeedTicketCreateDto {
    @NumberValidator({
        fieldName: 'qtd',
        label: 'Quantidade',
    })
    qtd: number;
}