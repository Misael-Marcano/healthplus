import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SettingsService } from '../settings/settings.service';

export interface SendMailResult {
  sent: boolean;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  /** True si hay SMTP por `SMTP_HOST` o por configuración persistida (host no vacío). */
  async isSmtpConfigured(): Promise<boolean> {
    const envHost = this.cfg.get<string>('SMTP_HOST')?.trim();
    if (envHost) return true;
    const row = await this.settingsService.getOrCreate();
    return !!(row.data.smtp?.host?.trim());
  }

  private async buildTransport(): Promise<nodemailer.Transporter | null> {
    const opt = await this.resolveSmtpOptions();
    if (!opt) return null;
    return nodemailer.createTransport(opt);
  }

  private async resolveSmtpOptions(): Promise<SMTPTransport.Options | null> {
    const envHost = this.cfg.get<string>('SMTP_HOST')?.trim();
    if (envHost) {
      const port = parseInt(this.cfg.get<string>('SMTP_PORT', '587'), 10);
      const secure = this.cfg.get<string>('SMTP_SECURE') === 'true';
      const user = this.cfg.get<string>('SMTP_USER', '')?.trim();
      const pass = this.cfg.get<string>('SMTP_PASSWORD', '');
      return {
        host: envHost,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
        tls:
          this.cfg.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') === 'false'
            ? { rejectUnauthorized: false }
            : undefined,
      };
    }

    const row = await this.settingsService.getOrCreate();
    const s = row.data.smtp;
    if (!s?.host?.trim()) return null;

    const port = parseInt(String(s.port || '587'), 10);
    const user = s.user?.trim();
    const pass = s.password ?? '';

    return {
      host: s.host.trim(),
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    };
  }

  private async resolveFromAddress(): Promise<string> {
    const explicit = this.cfg.get<string>('SMTP_FROM')?.trim();
    if (explicit) return explicit;
    const row = await this.settingsService.getOrCreate();
    const orgEmail = row.data.org?.email?.trim();
    if (orgEmail) return orgEmail;
    return 'noreply@healthplus.local';
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<SendMailResult> {
    const transport = await this.buildTransport();
    if (!transport) {
      return { sent: false, error: 'SMTP no configurado' };
    }

    const from = await this.resolveFromAddress();
    const subject = 'Restablecer contraseña — HealthPlus';

    const text = [
      'Has solicitado restablecer tu contraseña en HealthPlus (Sistema de Gestión de Requisitos).',
      '',
      `Abre este enlace (válido 1 hora):`,
      resetUrl,
      '',
      'Si no has sido tú, ignora este mensaje.',
    ].join('\n');

    const href = resetUrl.replace(/&/g, '&amp;');
    const html = `
      <p>Has solicitado restablecer tu contraseña en <strong>HealthPlus</strong>.</p>
      <p><a href="${href}">Restablecer contraseña</a></p>
      <p style="color:#64748b;font-size:12px;">El enlace expira en 1 hora. Si no has sido tú, ignora este correo.</p>
    `.trim();

    try {
      await transport.sendMail({
        from: `"HealthPlus" <${from}>`,
        to,
        subject,
        text,
        html,
      });
      return { sent: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Envío correo fallido: ${msg}`);
      return { sent: false, error: msg };
    }
  }

  /** Notifica al validador asignado que hay una validación pendiente. */
  async sendValidationRequestedEmail(
    to: string,
    params: {
      validadorNombre: string;
      requisitoCodigo: string;
      requisitoTitulo: string;
      solicitanteNombre: string;
      detailUrl: string;
      validationUrl: string;
    },
  ): Promise<SendMailResult> {
    const transport = await this.buildTransport();
    if (!transport) {
      return { sent: false, error: 'SMTP no configurado' };
    }

    const from = await this.resolveFromAddress();
    const subject = `Validación pendiente — ${params.requisitoCodigo} · HealthPlus`;

    const { requisitoCodigo, requisitoTitulo, solicitanteNombre } = params;
    const text = [
      `Hola ${params.validadorNombre},`,
      '',
      `Te han asignado la validación del requisito ${requisitoCodigo}: ${requisitoTitulo}.`,
      `Solicitado por: ${solicitanteNombre}.`,
      '',
      `Revisar en la app:`,
      params.validationUrl,
      '',
      `Detalle del requisito:`,
      params.detailUrl,
    ].join('\n');

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const hrefVal = params.validationUrl.replace(/&/g, '&amp;');
    const hrefDet = params.detailUrl.replace(/&/g, '&amp;');
    const html = `
      <p>Hola <strong>${esc(params.validadorNombre)}</strong>,</p>
      <p>Te han asignado la validación del requisito <strong>${esc(requisitoCodigo)}</strong>: ${esc(requisitoTitulo)}.</p>
      <p>Solicitado por: ${esc(solicitanteNombre)}.</p>
      <p><a href="${hrefVal}">Ir a Validación</a> · <a href="${hrefDet}">Ver requisito</a></p>
      <p style="color:#64748b;font-size:12px;">Mensaje automático de HealthPlus.</p>
    `.trim();

    try {
      await transport.sendMail({
        from: `"HealthPlus" <${from}>`,
        to,
        subject,
        text,
        html,
      });
      return { sent: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Envío correo validación fallido: ${msg}`);
      return { sent: false, error: msg };
    }
  }

  /** Notifica creación de versión de un requisito (manual o automática). */
  async sendRequirementVersionCreatedEmail(
    to: string,
    params: {
      destinatarioNombre: string;
      requisitoCodigo: string;
      requisitoTitulo: string;
      version: number;
      motivoCambio: string;
      actorNombre: string;
      detailUrl: string;
    },
  ): Promise<SendMailResult> {
    const transport = await this.buildTransport();
    if (!transport) {
      return { sent: false, error: 'SMTP no configurado' };
    }

    const from = await this.resolveFromAddress();
    const subject = `Nueva versión ${params.requisitoCodigo} v${params.version} · HealthPlus`;
    const text = [
      `Hola ${params.destinatarioNombre},`,
      '',
      `Se registró una nueva versión del requisito ${params.requisitoCodigo} (v${params.version}).`,
      `Título: ${params.requisitoTitulo}`,
      `Motivo: ${params.motivoCambio}`,
      `Registrado por: ${params.actorNombre}`,
      '',
      `Ver detalle:`,
      params.detailUrl,
    ].join('\n');

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const href = params.detailUrl.replace(/&/g, '&amp;');
    const html = `
      <p>Hola <strong>${esc(params.destinatarioNombre)}</strong>,</p>
      <p>Se registró una nueva versión del requisito <strong>${esc(params.requisitoCodigo)}</strong> (v${params.version}).</p>
      <p><strong>Título:</strong> ${esc(params.requisitoTitulo)}</p>
      <p><strong>Motivo:</strong> ${esc(params.motivoCambio)}</p>
      <p><strong>Registrado por:</strong> ${esc(params.actorNombre)}</p>
      <p><a href="${href}">Ver detalle del requisito</a></p>
      <p style="color:#64748b;font-size:12px;">Mensaje automático de HealthPlus.</p>
    `.trim();

    try {
      await transport.sendMail({
        from: `"HealthPlus" <${from}>`,
        to,
        subject,
        text,
        html,
      });
      return { sent: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Envío correo nueva versión fallido: ${msg}`);
      return { sent: false, error: msg };
    }
  }
}
