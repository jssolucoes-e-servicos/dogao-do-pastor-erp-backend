import { GendersEnum } from 'src/common/enums';

export interface IGender {
  [key: string]: (typeof GendersEnum)[keyof typeof GendersEnum];
}
