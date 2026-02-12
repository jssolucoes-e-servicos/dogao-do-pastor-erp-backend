// src/common/validators/index.ts

import { BooleanValidator } from 'src/common/validators/boolean.validator';
import { CepValidator } from 'src/common/validators/cep.validator';
import { CuidValidator } from 'src/common/validators/cuid.validator';
import { DateValidator } from 'src/common/validators/date.validator';
import { EmailValidator } from 'src/common/validators/email.validator';
import { EnumValidator } from 'src/common/validators/enum.validator';
import { FloatValidator } from 'src/common/validators/float.validator';
import { MongoIdValidator } from 'src/common/validators/mongo-id.validator';
import { NumberValidator } from 'src/common/validators/number.validator';
import { PhoneValidator } from 'src/common/validators/phone.validator';
import { StringValidator } from 'src/common/validators/string.validator';
import { NestedValidator } from './nested.validator';

export {
  BooleanValidator,
  NestedValidator,
  CepValidator,
  CuidValidator,
  DateValidator,
  EmailValidator,
  EnumValidator,
  FloatValidator,
  MongoIdValidator,
  NumberValidator,
  PhoneValidator,
  StringValidator
};

