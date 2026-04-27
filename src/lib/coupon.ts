import QRCode from "qrcode";

export const COUPON_BASE_URL = "https://a3marketingtech.github.io/a3-bright-display/#/coupon";

export function buildCouponUrl(mediaId: string): string {
  return `${COUPON_BASE_URL}/${mediaId}`;
}

export async function generateCouponQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
