import { GenresEnum } from 'src/common/enums';

export interface IGenre {
  [key: string]: (typeof GenresEnum)[keyof typeof GenresEnum];
}