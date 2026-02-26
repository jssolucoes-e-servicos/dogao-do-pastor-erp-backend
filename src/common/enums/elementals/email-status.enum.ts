/* export enum EmailStatusEnum {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
} */
export const EmailStatusEnum = {
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
} as const;

export type EmailStatusEnum =
  (typeof EmailStatusEnum)[keyof typeof EmailStatusEnum];
