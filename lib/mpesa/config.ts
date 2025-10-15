// M-Pesa API Configuration for Safaricom Sandbox
export const MPESA_CONFIG = {
  consumerKey: "Q5kHl738bWyzjyXPEFcays3ncvdqVp8RGJhJpWN0OmEQPpWd",
  consumerSecret: "AqsoPkgjLQE9C2VkyKHspaxNQoU6gSYgL8pHQoRyuqtciHGAPALq4ymjHLn2Vi3L",
  baseUrl: "https://sandbox.safaricom.co.ke",
  passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919", // Sandbox passkey
  shortCode: "174379", // Sandbox shortcode
  callbackUrl:
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/api/mpesa/callback",
}

export function getAuthorizationHeader(): string {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString("base64")
  return `Basic ${auth}`
}

export function generatePassword(timestamp: string): string {
  const data = `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passkey}${timestamp}`
  return Buffer.from(data).toString("base64")
}

export function getTimestamp(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}
