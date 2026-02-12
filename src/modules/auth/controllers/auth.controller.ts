import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { OtpRequestDto } from '../dto/otp-request.dto';
import { OtpValidateDto } from '../dto/otp-validate.dto';
import { AuthOtpService } from '../services/auth-otp.service';
import { AuthPartnerService } from '../services/auth-partner.service';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly authPartnerService: AuthPartnerService,
    private readonly otpService: AuthOtpService,
  ) {
    /* void */
  }

  @Post('request-otp')
  async requestOtp(@Body() body: OtpRequestDto) {
    return this.otpService.requestOtp(body);
  }

  @Post('validate-otp')
  async validateOtp(@Body() body: OtpValidateDto) {
    return this.otpService.validateOtp(body);
  }

  @Patch('change-password')
  async changePassword(@Body() body: ChangePasswordDto) {
    return this.service.changePassword(body);
  }

  @Post('partners/login')
  @HttpCode(HttpStatus.OK)
  async loginPartner(@Body() data: LoginDto) {
    return this.authPartnerService.login(data);
  }
}
