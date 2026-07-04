export interface ILayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaLink?: string;
}

export const getBrandedEmailLayout = (options: ILayoutOptions): string => {
  const { title, preheader = "", bodyHtml, ctaText, ctaLink } = options;

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const ctaSection = ctaText && ctaLink
    ? `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${ctaLink}" target="_blank" style="background-color: #FFFFFF; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 4px; display: inline-block; letter-spacing: 0.15em; text-transform: uppercase;">
          ${ctaText}
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          background-color: #0A0A0A;
          color: #D1D1D6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #0F0F0F;
          border: 1px solid #1F1F1F;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 32px 24px;
          text-align: center;
          border-bottom: 1px solid #1F1F1F;
        }
        .logo {
          font-size: 26px;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .content {
          padding: 40px 32px;
          line-height: 1.6;
          font-size: 15px;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          margin-top: 0;
          margin-bottom: 24px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
        }
        .footer {
          padding: 32px 24px;
          background-color: #070707;
          border-top: 1px solid #1F1F1F;
          text-align: center;
          font-size: 11px;
          color: #8E8E93;
        }
        .footer a {
          color: #FFFFFF;
          text-decoration: none;
          margin: 0 10px;
          letter-spacing: 0.1em;
        }
        .divider {
          height: 1px;
          background-color: #1F1F1F;
          margin: 24px 0;
        }
        .highlight {
          color: #FFFFFF;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">${preheader}</span>
      <div class="container">
        <div class="header">
          <a href="${clientUrl}" class="logo">BLUNT</a>
        </div>
        <div class="content">
          <h1 class="title">${title}</h1>
          <div>
            ${bodyHtml}
          </div>
          ${ctaSection}
        </div>
        <div class="footer">
          <p style="margin-bottom: 16px;">
            <a href="${clientUrl}/shop">SHOP</a>
            <a href="${clientUrl}/account">ACCOUNT</a>
            <a href="${clientUrl}/support">SUPPORT</a>
          </p>
          <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} BLUNT. ALL RIGHTS RESERVED.</p>
          <p style="letter-spacing: 0.05em; font-size: 10px; color: #48484A;">STRICTLY LUXURY STREETWEAR.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
