import { WeekDayEnum } from 'src/common/enums';

export interface IWeekDay {
  [key: string]: (typeof WeekDayEnum)[keyof typeof WeekDayEnum];
}