export type ErrorSeverityType = 'low' | 'medium' | 'high' | 'critical';

export type ErrorNotificationPayloadType = {
  title: string;
  message: string;
  severity: ErrorSeverityType;
  context?: Record<string, any>;
};
