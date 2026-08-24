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
      <div style="margin: 36px 0 24px 0; text-align: center;">
        <a href="${ctaLink}" target="_blank" style="background-color: #BEF500; color: #0B0B0B; font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 12px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 0px; display: inline-block; letter-spacing: 0.25em; text-transform: uppercase; border: 1px solid #BEF500;">
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
          background-color: #080808;
          color: #E0E2D6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 32px auto;
          background-color: #0E0E0E;
          border: 1px solid #222222;
          border-radius: 0px;
          overflow: hidden;
        }
        .header {
          padding: 32px 24px 20px 24px;
          text-align: center;
          border-bottom: 1px solid #1C1C1C;
          background-color: #090909;
        }
        .logo {
          font-size: 32px;
          font-weight: 900;
          color: #BEF500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          text-decoration: none;
          font-family: 'Courier New', Courier, monospace, sans-serif;
        }
        .tagline {
          font-size: 9px;
          color: #6E6E73;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-top: 6px;
          font-family: 'Courier New', Courier, monospace, sans-serif;
        }
        .content {
          padding: 36px 32px;
          line-height: 1.6;
          font-size: 14px;
        }
        .title {
          font-size: 20px;
          font-weight: 900;
          color: #FFFFFF;
          margin-top: 0;
          margin-bottom: 20px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'Courier New', Courier, monospace, sans-serif;
          border-left: 3px solid #BEF500;
          padding-left: 12px;
        }
        .footer {
          padding: 28px 24px;
          background-color: #060606;
          border-top: 1px solid #1C1C1C;
          text-align: center;
          font-size: 11px;
          color: #6E6E73;
          font-family: 'Courier New', Courier, monospace, sans-serif;
        }
        .footer a {
          color: #BEF500;
          text-decoration: none;
          margin: 0 12px;
          letter-spacing: 0.15em;
          font-size: 10px;
          font-weight: bold;
        }
        .divider {
          height: 1px;
          background-color: #222222;
          margin: 24px 0;
        }
        .highlight {
          color: #BEF500;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <span style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">${preheader}</span>
      <div class="container">
        <div class="header">
          <a href="${clientUrl}" class="logo">BLUNT</a>
          <div class="tagline">ARCHIVAL STREETWEAR ECOSYSTEM</div>
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
            <a href="${clientUrl}/drop">LATEST DROP</a>
            <a href="${clientUrl}/orders">MY ORDERS</a>
          </p>
          <p style="margin-bottom: 6px; font-size: 10px;">© ${new Date().getFullYear()} BLUNT STUDIOS. NO FILTER. JUST BLUNT.</p>
          <p style="letter-spacing: 0.1em; font-size: 9px; color: #48484A;">FOR SUPPORT CONTACT SUPPORT@BLUNTSTUDIOS.COM</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
