// src/common/interfaces/elementals/gender.interfaces.ts
import { GendersEnum } from 'src/common/enums';

/**
 * Interface de generos - faceia a enum
 * @interface IGender
 * @property {enum} GendersEnum - enum de generos
 */
export interface IGender {
  [key: string]: (typeof GendersEnum)[keyof typeof GendersEnum];
}
