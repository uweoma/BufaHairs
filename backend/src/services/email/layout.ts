/** Branded, email-client-safe HTML layout (inline styles, table-free minimal). */
const BRAND = 'BufaHairs';
const PURPLE = '#5B21B6';
const ROYAL = '#7C3AED';
const LIGHT = '#EDE9FE';
const DARK = '#18181B';

export interface EmailButton {
  label: string;
  url: string;
}

export function renderLayout(opts: {
  title: string;
  bodyHtml: string;
  preheader?: string;
}): string {
  const { title, bodyHtml, preheader = '' } = opts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${DARK};">
  <span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:20px 0;">
      <span style="font-size:26px;font-weight:800;letter-spacing:0.5px;color:${PURPLE};">${BRAND}</span>
    </div>
    <div style="background:#FFFFFF;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(91,33,182,0.08);">
      ${bodyHtml}
    </div>
    <div style="text-align:center;color:#71717A;font-size:12px;padding:24px 8px;line-height:1.6;">
      <p style="margin:0 0 8px;">You are receiving this email because you have an account with ${BRAND}.</p>
      <p style="margin:0;">© ${new Date().getFullYear()} ${BRAND}. Premium human hair, wigs &amp; extensions.</p>
    </div>
  </div>
</body>
</html>`;
}

export function button(btn: EmailButton): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${btn.url}" style="display:inline-block;background:linear-gradient(135deg,${PURPLE},${ROYAL});color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:600;font-size:15px;">${btn.label}</a>
  </div>`;
}

export function heading(text: string): string {
  return `<h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:${DARK};">${text}</h1>`;
}

export function paragraph(text: string): string {
  return `<p style="font-size:15px;line-height:1.7;color:#3F3F46;margin:0 0 16px;">${text}</p>`;
}

export function infoBox(html: string): string {
  return `<div style="background:${LIGHT};border-radius:12px;padding:16px 20px;margin:16px 0;font-size:14px;color:${DARK};">${html}</div>`;
}

export const brandColors = { PURPLE, ROYAL, LIGHT, DARK };
