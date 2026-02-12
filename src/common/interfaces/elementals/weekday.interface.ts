// src/common/interfaces/elementals/weekday.interface.ts
import { WeekDayEnum } from 'src/common/enums';

/**
 * Interface de Dias da semana - faceia a enum
 * @interface IWeekDay
 * @property {enum} WeekDayEnum - enum de dias da semana
 */
export interface IWeekDay {
  [key: string]: (typeof WeekDayEnum)[keyof typeof WeekDayEnum];
}
