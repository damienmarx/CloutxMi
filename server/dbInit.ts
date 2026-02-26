import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * Initialize the database schema
 * This ensures all required tables exist when the application starts.
 */
export async function initializeDatabase() {
  const db = await getDb();
  if (!db) {
    console.error("[DB Init] Database unavailable");
    return;
  }

  console.log("[DB Init] Initializing database schema...");

  try {
    // Create users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create wallets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        balance DECIMAL(20, 8) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Create game_results table for provably fair tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        gameType VARCHAR(50) NOT NULL,
        betAmount DECIMAL(20, 8) NOT NULL,
        payout DECIMAL(20, 8) NOT NULL,
        won BOOLEAN NOT NULL,
        serverSeed VARCHAR(255) NOT NULL,
        clientSeed VARCHAR(255) NOT NULL,
        nonce INT NOT NULL,
        resultHash VARCHAR(255) NOT NULL,
        gameData JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Create chat_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        username VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        mentions JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    console.log("[DB Init] Database initialization complete.");
  } catch (error) {
    console.error("[DB Init] Error initializing database:", error);
  }
}
