import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendEmailService } from 'src/send-email/send-email.service';

@Module({
  imports: [ConfigModule],
  providers: [SendEmailService],
  exports: [SendEmailService],
})
export class SendEmailModule {}
