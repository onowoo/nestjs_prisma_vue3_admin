import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendResetPasswordMail(email: string, token: string) {
    const resetLink = `${this.configService.get('FRONTEND_URL')}/#/login?token=${token}`;
    const emailContent = `
    <p>您好！</p>
    <p>您请求重置密码。请点击下面的链接重置密码：</p>
    <p>
        <a href="${resetLink}">重置密码</a>
    </p>
    <p>此链接将在 24 小时后失效。</p>
    <p>如果您没有请求重置密码，请忽略此邮件。</p>
  `;
    await this.mailerService.sendMail({
      to: email,
      subject: '重置密码',
      html:emailContent
    });
  }
}