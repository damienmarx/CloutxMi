import axios from "axios";

/**
 * Discord OAuth Authentication Module
 * Handles Discord login, token exchange, and user profile fetching
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string;
  verified: boolean;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * Get Discord OAuth authorization URL
 */
export function getDiscordAuthUrl(): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.DOMAIN || "http://localhost:3000"}/api/auth/discord/callback`;
  const scope = ["identify", "email"].join("%20");

  if (!clientId) {
    throw new Error("DISCORD_CLIENT_ID is not configured");
  }

  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}

/**
 * Exchange Discord authorization code for access token
 */
export async function exchangeDiscordCode(code: string): Promise<DiscordTokenResponse> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${process.env.DOMAIN || "http://localhost:3000"}/api/auth/discord/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth credentials are not configured");
  }

  try {
    const response = await axios.post<DiscordTokenResponse>(
      `${DISCORD_API_BASE}/oauth2/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[Discord Auth] Token exchange failed:", error);
    throw new Error("Failed to exchange Discord code for token");
  }
}

/**
 * Fetch Discord user profile
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  try {
    const response = await axios.get<DiscordUser>(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("[Discord Auth] Failed to fetch user profile:", error);
    throw new Error("Failed to fetch Discord user profile");
  }
}

/**
 * Refresh Discord access token
 */
export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth credentials are not configured");
  }

  try {
    const response = await axios.post<DiscordTokenResponse>(
      `${DISCORD_API_BASE}/oauth2/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[Discord Auth] Token refresh failed:", error);
    throw new Error("Failed to refresh Discord token");
  }
}

/**
 * Verify Discord user and create/update in database
 */
export async function verifyAndCreateDiscordUser(
  discordUser: DiscordUser,
  accessToken: string,
  refreshToken: string
) {
  // This will be implemented in the auth router
  // to handle database operations
  return {
    discordId: discordUser.id,
    username: discordUser.username,
    email: discordUser.email,
    avatar: discordUser.avatar,
    accessToken,
    refreshToken,
  };
}
