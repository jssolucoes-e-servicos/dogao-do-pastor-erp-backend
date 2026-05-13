import { EditionEntity } from 'src/common/entities';

export type EditionResponseType = {
  edition: EditionEntity | null;
  message: string;
  configs?: {
    combo_enabled: boolean;
    pdv_enabled: boolean;
  };
};
