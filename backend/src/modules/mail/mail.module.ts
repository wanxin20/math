import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { VerificationCodeService } from './verification-code.service';

@Module({
  providers: [MailService, VerificationCodeService],
  exports: [MailService, VerificationCodeService],
})
export class MailModule {}
