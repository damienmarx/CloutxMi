import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { db } from "./_core/db";
import { users, referrals, notifications } from "./schema";
import { eq, and } from "drizzle-orm";

export const referralRouter = router({
  // Generate a unique referral code for the user
  generateReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    
    // Check if user already has a referral code
    const existingReferral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);

    if (existingReferral.length > 0) {
      return {
        success: true,
        code: existingReferral[0].code,
        message: "Your referral code already exists"
      };
    }

    // Generate a unique code
    const code = `CLOUT${userId}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Store the referral code
    await db.insert(referrals).values({
      referrerId: userId,
      code,
      createdAt: new Date(),
      totalReferred: 0,
      totalRewards: 0
    });

    return {
      success: true,
      code,
      message: "Referral code generated successfully"
    };
  }),

  // Get referral stats for the current user
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const referralData = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);

    if (referralData.length === 0) {
      return {
        code: null,
        totalReferred: 0,
        totalRewards: 0,
        referredUsers: []
      };
    }

    const referral = referralData[0];

    // Get list of referred users
    const referredUsersList = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.referredBy, referral.id));

    return {
      code: referral.code,
      totalReferred: referral.totalReferred,
      totalRewards: referral.totalRewards,
      referredUsers: referredUsersList
    };
  }),

  // Register a new user with a referral code
  registerWithReferral: publicProcedure
    .input(z.object({
      referralCode: z.string().optional(),
      username: z.string(),
      email: z.string().email(),
      password: z.string().min(8)
    }))
    .mutation(async ({ input }) => {
      let referrerId = null;

      // Validate referral code if provided
      if (input.referralCode) {
        const referralData = await db
          .select()
          .from(referrals)
          .where(eq(referrals.code, input.referralCode))
          .limit(1);

        if (referralData.length === 0) {
          return {
            success: false,
            message: "Invalid referral code"
          };
        }

        referrerId = referralData[0].referrerId;
      }

      // Create new user (password hashing should be done in actual implementation)
      const newUser = await db.insert(users).values({
        username: input.username,
        email: input.email,
        password: input.password, // In production, hash this
        referredBy: referrerId,
        createdAt: new Date(),
        balance: 0,
        totalWagered: 0,
        role: "user",
        isMuted: false
      });

      // Update referral stats if applicable
      if (referrerId) {
        await db
          .update(referrals)
          .set({
            totalReferred: (await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)))[0]?.totalReferred + 1 || 1
          })
          .where(eq(referrals.referrerId, referrerId));

        // Send notification to referrer
        await db.insert(notifications).values({
          userId: referrerId,
          title: "New Referral Joined!",
          message: `${input.username} just joined CloutScape using your referral code. You've earned a referral bonus!`,
          type: "referral",
          read: false,
          createdAt: new Date()
        });
      }

      return {
        success: true,
        message: "User registered successfully",
        userId: newUser.insertId
      };
    }),

  // Get referral rewards
  getReferralRewards: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const referralData = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);

    if (referralData.length === 0) {
      return {
        totalRewards: 0,
        rewardBreakdown: {
          signupBonus: 0,
          wagerBonus: 0,
          rainBonus: 0
        }
      };
    }

    // Calculate rewards based on referral activity
    const referral = referralData[0];
    const signupBonus = referral.totalReferred * 10; // $10 per signup
    const wagerBonus = Math.floor(referral.totalReferred * 5); // $5 per referred user's first wager
    const rainBonus = referral.totalRewards - signupBonus - wagerBonus; // Remaining from rain events

    return {
      totalRewards: referral.totalRewards,
      rewardBreakdown: {
        signupBonus,
        wagerBonus,
        rainBonus
      }
    };
  }),

  // Claim referral rewards
  claimReferralRewards: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const referralData = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);

    if (referralData.length === 0 || referralData[0].totalRewards === 0) {
      return {
        success: false,
        message: "No rewards to claim"
      };
    }

    const referral = referralData[0];
    const rewards = referral.totalRewards;

    // Add rewards to user's balance
    const userBalance = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const newBalance = (userBalance[0]?.balance || 0) + rewards;

    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));

    // Reset rewards
    await db
      .update(referrals)
      .set({ totalRewards: 0 })
      .where(eq(referrals.referrerId, userId));

    // Send notification
    await db.insert(notifications).values({
      userId,
      title: "Referral Rewards Claimed!",
      message: `You've successfully claimed $${rewards.toFixed(2)} in referral rewards!`,
      type: "reward",
      read: false,
      createdAt: new Date()
    });

    return {
      success: true,
      message: `Claimed $${rewards.toFixed(2)} in referral rewards`,
      newBalance
    };
  })
});
