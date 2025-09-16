import { Request } from 'express';
import { IUserResponse } from 'src/common/interfaces';

export interface IRequestWithUser extends Request {
  user: IUserResponse;
}