// src/common/interfaces/index.ts
import {
  IPaginatedResponse,
  IPaginationMeta,
} from 'src/common/interfaces/elementals/paginated-response.interface';
import { IConfig } from './elementals/config.interface';
import { IEvolutionApiSendResponse } from './elementals/evolution-api-send-response.interface';
import { IGender } from './elementals/gender.interface';
import { IGenericUploadResult } from './elementals/generic-upload-result.interface';
import { IWeekDay } from './elementals/weekday.interface';
import { IIsWhatsappResponse } from './is-whatsapp-response.interface';

export type {
  IConfig, IEvolutionApiSendResponse,
  IGender,
  IGenericUploadResult, IIsWhatsappResponse, IPaginatedResponse,
  IPaginationMeta,
  IWeekDay
};

