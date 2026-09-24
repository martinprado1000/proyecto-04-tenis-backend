import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailUserDto } from 'src/users/dto';

@Injectable()
export class SendEmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  public recoveryPassword(
    emailUserDto: EmailUserDto,
    newPassword: string,
    organizationName?: string,
    organizationLogoUrl?: string,
  ): void {
    const from = this.configService.get<string>('MAILER_USER');
    const orgName = organizationName || 'Sistema de Tenis';
    const subject = `${orgName} - Recuperación de contraseña ✔`;

    // Detectamos si el logoUrl es un Data URL base64 o una URL normal
    const attachments: any[] = [];
    let logoSection: string;

    if (organizationLogoUrl) {
      const isDataUrl = organizationLogoUrl.startsWith('data:');

      if (isDataUrl) {
        // Extraemos el contentType y el contenido base64 del data URL
        // Formato: data:<contentType>;base64,<base64data>
        const matches = organizationLogoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1]; // ej: image/png, image/jpeg
          const base64Content = matches[2];
          const cid = 'org-logo@systemmp';

          attachments.push({
            filename: 'logo.png',
            content: Buffer.from(base64Content, 'base64'),
            contentType,
            cid, // Content-ID usado en el HTML como src="cid:org-logo@systemmp"
          });

          logoSection = `<div style="text-align:center; margin-bottom: 24px;">
            <img src="cid:${cid}" alt="${orgName}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />
          </div>`;
        } else {
          // Data URL con formato inesperado → fallback emoji
          logoSection = `<div style="text-align:center; margin-bottom: 24px;">
            <div style="display:inline-block; background: linear-gradient(135deg,#2563eb,#7c3aed); border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">🎾</div>
          </div>`;
        }
      } else {
        // URL normal (http/https) — se referencia directamente
        logoSection = `<div style="text-align:center; margin-bottom: 24px;">
          <img src="${organizationLogoUrl}" alt="${orgName}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />
        </div>`;
      }
    } else {
      // Sin logo → emoji de tenis como fallback
      logoSection = `<div style="text-align:center; margin-bottom: 24px;">
        <div style="display:inline-block; background: linear-gradient(135deg,#2563eb,#7c3aed); border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">🎾</div>
      </div>`;
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperación de contraseña</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#1e293b; border-radius:16px; overflow:hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">

          <!-- Header gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%); padding: 36px 40px 32px; text-align:center;">
              ${logoSection}
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:-0.5px;">${orgName}</h1>
              <p style="margin:8px 0 0; color:#bfdbfe; font-size:14px;">Plataforma de Torneos y Fixtures</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin:0 0 8px; color:#f1f5f9; font-size:20px; font-weight:600;">Recuperación de contraseña</h2>
              <p style="margin:0 0 24px; color:#94a3b8; font-size:14px; line-height:1.6;">
                Recibiste este email porque solicitaste restablecer tu contraseña. A continuación encontrás tus nuevas credenciales de acceso.
              </p>

              <!-- Credentials box -->
              <div style="background:#0f172a; border:1px solid #334155; border-radius:12px; padding:24px; margin-bottom:24px;">
                <p style="margin:0 0 12px; color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Usuario</p>
                <p style="margin:0 0 20px; color:#e2e8f0; font-size:16px; font-weight:500;">${emailUserDto.email}</p>

                <p style="margin:0 0 12px; color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">Nueva contraseña temporal</p>
                <div style="background:#1e293b; border:1px solid #6d28d9; border-radius:8px; padding:14px 18px; display:inline-block; width:100%; box-sizing:border-box;">
                  <span style="font-family:'Courier New',Courier,monospace; font-size:22px; font-weight:700; color:#a78bfa; letter-spacing:0.12em;">${newPassword}</span>
                </div>
              </div>

              <!-- Warning -->
              <div style="background:#451a03; border:1px solid #92400e; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
                <p style="margin:0; color:#fbbf24; font-size:13px; line-height:1.6;">
                  ⚠️ <strong>Por seguridad</strong>, te recomendamos cambiar esta contraseña temporal la próxima vez que inicies sesión desde el perfil de tu cuenta.
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;">
                <p style="margin:0 0 16px; color:#64748b; font-size:13px;">¿Listo para ingresar?</p>
                <div style="display:inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius:8px; padding:1px;">
                  <div style="background:#1e293b; border-radius:7px; padding:10px 28px;">
                    <span style="color:#93c5fd; font-size:14px; font-weight:600;">Ingresar a ${orgName}</span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a; padding:20px 40px; text-align:center; border-top:1px solid #1e293b;">
              <p style="margin:0; color:#475569; font-size:12px; line-height:1.6;">
                Este email fue enviado automáticamente por ${orgName}.<br/>
                Si no solicitaste este cambio, contactá con el administrador de tu organización.
              </p>
              <p style="margin:12px 0 0; color:#334155; font-size:11px;">
                🎾 Plataforma de Torneos y Fixtures · ${new Date().getFullYear()}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    this.mailerService
      .sendMail({
        from: `"${orgName}" <${from}>`,
        to: emailUserDto.email,
        subject,
        html,
        attachments,
      })
      .then(() => {
        return 'enviado';
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
