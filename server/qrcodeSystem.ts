import { sql } from "drizzle-orm";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { getDb } from "./db";

/**
 * QR Code Generation System for Crypto Deposits
 * Generates QR codes for wallet addresses and payment requests
 */

export interface QRCodeData {
  id: string;
  userId: number;
  walletAddress: string;
  network: string;
  asset: string;
  amount?: string;
  usdValue?: string;
  qrCodeUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PaymentRequest {
  id: string;
  userId: number;
  walletAddress: string;
  amount: string;
  asset: string;
  network: string;
  description: string;
  qrCode: string;
  expiresAt: Date;
  isPaid: boolean;
  createdAt: Date;
}

/**
 * Generate QR code for wallet address
 */
export async function generateWalletQRCode(
  userId: number,
  walletAddress: string,
  network: string,
  asset: string
): Promise<string> {
  try {
    // Create wallet URI based on network
    let walletUri = "";

    switch (network) {
      case "ethereum":
      case "bsc":
      case "polygon":
      case "arbitrum":
        walletUri = `ethereum:${walletAddress}`;
        break;
      case "bitcoin":
        walletUri = `bitcoin:${walletAddress}`;
        break;
      default:
        walletUri = walletAddress;
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(walletUri, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("[QR Code] Error generating wallet QR code:", error);
    throw error;
  }
}

/**
 * Generate QR code for payment request with amount
 */
export async function generatePaymentQRCode(
  userId: number,
  walletAddress: string,
  amount: string,
  asset: string,
  network: string
): Promise<string> {
  try {
    // Create payment URI based on network and asset
    let paymentUri = "";

    switch (network) {
      case "ethereum":
      case "bsc":
      case "polygon":
      case "arbitrum":
        // EIP-681 format for Ethereum-compatible networks
        paymentUri = `ethereum:${walletAddress}?value=${amount}`;
        if (asset !== "eth" && asset !== "bnb" && asset !== "matic") {
          // Add token transfer data for ERC-20 tokens
          paymentUri += `&data=0xa9059cbb`;
        }
        break;
      case "bitcoin":
        // BIP70 format for Bitcoin
        paymentUri = `bitcoin:${walletAddress}?amount=${amount}`;
        break;
      default:
        paymentUri = `${walletAddress}?amount=${amount}`;
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(paymentUri, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("[QR Code] Error generating payment QR code:", error);
    throw error;
  }
}

/**
 * Create and store a QR code record
 */
export async function createQRCodeRecord(
  userId: number,
  walletAddress: string,
  network: string,
  asset: string,
  qrCodeUrl: string,
  amount?: string,
  usdValue?: string
): Promise<QRCodeData> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const id = nanoid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await (await getDb()).execute(sql` INSERT INTO qrCodes (id, userId, walletAddress, network, asset, amount, usdValue, qrCodeUrl, expiresAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `); // Params: id, userId, walletAddress, network, asset, amount || null, usdValue || null, qrCodeUrl, expiresAt

    return {
      id,
      userId,
      walletAddress,
      network,
      asset,
      amount,
      usdValue,
      qrCodeUrl,
      expiresAt,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("[QR Code] Error creating QR code record:", error);
    throw error;
  }
}

/**
 * Create a payment request with QR code
 */
export async function createPaymentRequest(
  userId: number,
  walletAddress: string,
  amount: string,
  asset: string,
  network: string,
  description: string
): Promise<PaymentRequest> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const id = nanoid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Generate QR code
    const qrCode = await generatePaymentQRCode(userId, walletAddress, amount, asset, network);

    await (await getDb()).execute(sql` INSERT INTO paymentRequests (id, userId, walletAddress, amount, asset, network, description, qrCode, expiresAt, isPaid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0) `); // Params: id, userId, walletAddress, amount, asset, network, description, qrCode, expiresAt

    return {
      id,
      userId,
      walletAddress,
      amount,
      asset,
      network,
      description,
      qrCode,
      expiresAt,
      isPaid: false,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("[QR Code] Error creating payment request:", error);
    throw error;
  }
}

/**
 * Get QR code record
 */
export async function getQRCodeRecord(qrCodeId: string): Promise<QRCodeData | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT * FROM qrCodes WHERE id = ? `); // Params: qrCodeId

    if (!result || result.length === 0) {
      return null;
    }

    const qr = result[0];
    return {
      id: qr.id,
      userId: qr.userId,
      walletAddress: qr.walletAddress,
      network: qr.network,
      asset: qr.asset,
      amount: qr.amount,
      usdValue: qr.usdValue,
      qrCodeUrl: qr.qrCodeUrl,
      expiresAt: qr.expiresAt,
      createdAt: qr.createdAt,
    };
  } catch (error) {
    console.error("[QR Code] Error getting QR code record:", error);
    return null;
  }
}

/**
 * Get payment request
 */
export async function getPaymentRequest(requestId: string): Promise<PaymentRequest | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql` SELECT * FROM paymentRequests WHERE id = ? `); // Params: requestId

    if (!result || result.length === 0) {
      return null;
    }

    const req = result[0];
    return {
      id: req.id,
      userId: req.userId,
      walletAddress: req.walletAddress,
      amount: req.amount,
      asset: req.asset,
      network: req.network,
      description: req.description,
      qrCode: req.qrCode,
      expiresAt: req.expiresAt,
      isPaid: req.isPaid === 1,
      createdAt: req.createdAt,
    };
  } catch (error) {
    console.error("[QR Code] Error getting payment request:", error);
    return null;
  }
}

/**
 * Mark payment request as paid
 */
export async function markPaymentRequestAsPaid(requestId: string, txHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    await (await getDb()).execute(sql`  UPDATE paymentRequests SET isPaid = 1, txHash = ? WHERE id = ?  `); // Params: txHash, requestId
  } catch (error) {
    console.error("[QR Code] Error marking payment as paid:", error);
    throw error;
  }
}

/**
 * Clean up expired QR codes
 */
export async function cleanupExpiredQRCodes(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    const result = await (await getDb()).execute(sql`  DELETE FROM qrCodes WHERE expiresAt < NOW()  `);

    console.log(`[QR Code] Cleaned up expired QR codes`);
    return result.affectedRows || 0;
  } catch (error) {
    console.error("[QR Code] Error cleaning up expired QR codes:", error);
    return 0;
  }
}

/**
 * Generate QR code as SVG (alternative format)
 */
export async function generateWalletQRCodeSVG(
  walletAddress: string,
  network: string
): Promise<string> {
  try {
    let walletUri = "";

    switch (network) {
      case "ethereum":
      case "bsc":
      case "polygon":
      case "arbitrum":
        walletUri = `ethereum:${walletAddress}`;
        break;
      case "bitcoin":
        walletUri = `bitcoin:${walletAddress}`;
        break;
      default:
        walletUri = walletAddress;
    }

    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(walletUri, {
      errorCorrectionLevel: "H",
      type: "image/svg+xml",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrCodeSVG;
  } catch (error) {
    console.error("[QR Code] Error generating SVG QR code:", error);
    throw error;
  }
}
