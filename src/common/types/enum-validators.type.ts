// src/common/types/enum-validator-type.ts

export type EnumValidatorType<T extends object> = {
  fieldName: string;
  label?: string;
  enumType: T;
  optional?: boolean;
  description?: string;
  exemple?: string;
};
