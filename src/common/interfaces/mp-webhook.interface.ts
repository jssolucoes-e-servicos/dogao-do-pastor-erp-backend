// src/common/interfaces/mp-webhook.interface.ts
export interface IMPWebhook {
  id?: string;
  live_mode?: boolean;
  type?: string;
  topic?: string;
  date_created?: string;
  user_id?: string;
  application_id?: string;
  action?: string;
  api_version?: string;
  data?: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
