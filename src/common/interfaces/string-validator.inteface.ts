export interface IStringValidator {
  fieldName: string;
  label?: string;
  minLength?: number;
  optional?: boolean;
  description?: string;
  exemple?: string;
}