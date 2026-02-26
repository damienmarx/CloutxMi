# CloutScape: Fully Operational Features

This document outlines the features of the CloutScape platform that are fully operational and ready for user engagement, based on the latest codebase and deployment status.

## 1. Core Platform Infrastructure

*   **Robust Backend**: A TypeScript-based backend utilizing `express` and `trpc` for efficient API handling.
*   **Database Management**: `Drizzle ORM` with MySQL for persistent data storage, including user accounts, wallets, game states, and transaction history.
*   **Scalable Deployment**: Configured for `PM2` process management, enabling high availability and load balancing for the backend services.
*   **Secure Environment**: Implemented `Helmet` for HTTP header security, `express-rate-limit` for API abuse prevention, and `CORS` for secure cross-origin resource sharing.
*   **Authentication System**: Secure user registration, login, and session management with JWTs.
*   **Developer Security**: Token-based authorization for sensitive developer and admin routes, ensuring code and data integrity.

## 2. User & Wallet Management

*   **User Accounts**: Creation, management, and authentication of user profiles.
*   **Wallet System**: Individual user wallets for balance tracking, deposits, and withdrawals.
*   **Transaction History**: Comprehensive logging of all financial transactions within the platform.
*   **Admin User Management**: Basic administrative capabilities to list users and adjust balances (via Admin Dashboard).

## 3. Gaming Engine & Logic

*   **Provably Fair Games**: Fully implemented cryptographic provably fair engine for:
    *   **Dice Game**: Users can set target numbers and verify roll outcomes.
    *   **Crash Game**: Dynamic crash point generation with verifiable outcomes.
    *   **Coinflip Game**: 50/50 chance game with transparent results.
*   **Game History**: Storage and retrieval of game outcomes for user review and fairness verification.

## 4. Real-Time Communication & Community

*   **Socket.IO Integration**: Real-time communication layer initialized and integrated.
*   **Live Chat System**: Fully functional live chat with user eligibility checks (deposit/wager requirements) and message broadcasting.
*   **Rain Events**: Backend logic for initiating and managing rain events, distributing rewards to active participants.

## 5. Old School RuneScape (OSRS) Integration

*   **OSRS GP Exchange**: Functionality to convert OSRS GP to USD and vice-versa.
*   **Mule Transaction System**: Logic for creating, completing, and canceling OSRS GP deposit and withdrawal transactions, including random world and mule assignment.
*   **OSRS Username Validation**: Ensures valid OSRS usernames for transactions.

## 6. User Interface (UI) & Experience

*   **Obsidian UI Shell**: A modern, sleek, and responsive user interface with a consistent theme, including:
    *   Dynamic sidebar navigation.
    *   Integrated live chat panel.
    *   User balance display.
*   **Dashboard**: Central hub for users to view their balance, access games, and manage wallet operations.
*   **Dedicated Game Pages**: Individual pages for Dice, Crash, Coinflip, Slots, Keno, Blackjack, and Roulette (frontend shells ready for game logic integration).
*   **OSRS Deposit/Withdrawal Pages**: User interfaces for initiating OSRS GP exchange.
*   **Admin Dashboard**: Dedicated UI for platform administrators to monitor stats and manage users.

## 7. Deployment & Development Tools

*   **WSL2 Compatibility**: Scripts and configurations optimized for seamless deployment within a Windows Subsystem for Linux 2 environment.
*   **Cloudflare Tunnel Ready**: Integrated `cloudflared` installation and setup for secure, public access via Cloudflare Tunnel.
*   **Automated Deployment Scripts**: Robust `.sh` scripts for environment setup, dependency installation, database initialization, and application deployment (`setup_master_v2.sh`).
*   **CloutScape CLI (Aliases)**: A suite of custom alias commands for simplified management and interaction with the deployed application.
*   **Auto-Git Workflow**: Automated `git pull` and rebuild/restart capabilities for continuous deployment.
*   **Dynamic Configuration Management**: `.env` file handling for secure and flexible environment configuration.
