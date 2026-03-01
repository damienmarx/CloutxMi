
import { z } from "zod";

export const RegisterSchema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export const LinkDiscordSchema = z.object({
  discordId: z.string(),
});

export const LinkTelegramSchema = z.object({
  telegramId: z.string(),
});

export const DepositSchema = z.object({ amount: z.number().positive() });

export const WithdrawSchema = z.object({ amount: z.number().positive() });

export const TipSchema = z.object({
  toUsername: z.string(),
  amount: z.number().positive(),
});

export const GetTransactionHistorySchema = z.object({ limit: z.number().int().positive().max(100).optional() });

export const PlayKenoSchema = z.object({
  selectedNumbers: z.array(z.number().int().min(1).max(80)).min(1).max(10),
  betAmount: z.number().positive(),
  turboMode: z.boolean().optional(),
});

export const PlaySlotsSchema = z.object({
  betAmount: z.number().positive(),
  lines: z.number().int().min(1).max(20),
});

export const PlayBlackjackSchema = z.object({
  betAmount: z.number().positive(),
  action: z.enum(["hit", "stand", "double", "split"]),
});

export const PlayRouletteSchema = z.object({
  betAmount: z.number().positive(),
  prediction: z.string(),
  targetNumber: z.number().int().min(0).max(36).optional(),
  won: z.boolean(),
});

export const PlayDiceSchema = z.object({
  betAmount: z.number().positive(),
  prediction: z.enum(["over", "under", "exact"]),
  targetNumber: z.number().min(1).max(100),
  diceRoll: z.number().min(1).max(100),
  won: z.boolean(),
});
