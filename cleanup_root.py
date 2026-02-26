import os
import filecmp

def cleanup():
    root_files = [f for f in os.listdir('.') if os.path.isfile(f)]
    
    mapping = {
        'client/src/components/ui/': [
            'accordion.tsx', 'alert-dialog.tsx', 'alert.tsx', 'aspect-ratio.tsx', 'avatar.tsx',
            'badge.tsx', 'breadcrumb.tsx', 'button-group.tsx', 'button.tsx', 'calendar.tsx',
            'card.tsx', 'carousel.tsx', 'chart.tsx', 'checkbox.tsx', 'collapsible.tsx',
            'command.tsx', 'context-menu.tsx', 'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx',
            'empty.tsx', 'field.tsx', 'form.tsx', 'hover-card.tsx', 'input-group.tsx',
            'input-otp.tsx', 'input.tsx', 'item.tsx', 'kbd.tsx', 'label.tsx', 'menubar.tsx',
            'navigation-menu.tsx', 'pagination.tsx', 'popover.tsx', 'progress.tsx',
            'radio-group.tsx', 'resizable.tsx', 'scroll-area.tsx', 'select.tsx', 'separator.tsx',
            'sheet.tsx', 'sidebar.tsx', 'skeleton.tsx', 'slider.tsx', 'sonner.tsx', 'spinner.tsx',
            'switch.tsx', 'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toggle-group.tsx',
            'toggle.tsx', 'tooltip.tsx'
        ],
        'server/': [
            'accountSecurity.ts', 'adminRouter.ts', 'auth.comprehensive.test.ts',
            'auth.logout.test.ts', 'auth.test.ts', 'auth.ts', 'authRouter.ts',
            'cryptoWalletRouter.ts', 'cryptoWalletSystem.ts', 'currencyExchange.ts',
            'db.ts', 'dbInit.ts', 'degensdenRouter.ts', 'degensdenSlots.ts',
            'emailVerification.ts', 'gameHistoryTracking.ts', 'gameLogic.test.ts',
            'gameLogic.ts', 'games.ts', 'leaderboardRouter.ts', 'leaderboardSystem.ts',
            'liveFeatures.ts', 'liveRouter.ts', 'osrsDepositWithdraw.ts',
            'osrsGamblingFeatures.ts', 'osrsGamblingRouter.ts', 'osrsSystem.ts',
            'passwordReset.ts', 'provablyFair.ts', 'qrcodeSystem.ts', 'routers.ts',
            'securityMiddleware.ts', 'storage.ts', 'trustWalletConfig.ts',
            'trustWalletRouter.ts', 'updateModule.ts', 'userStatsComprehensive.ts',
            'userStatsRouter.ts', 'userStatsSystem.ts', 'vipAndLeaderboard.test.ts',
            'vipProgressRouter.ts', 'vipProgressSystem.ts', 'vipProgressVisualization.ts',
            'wagerSystem.ts', 'wallet.comprehensive.test.ts', 'wallet.test.ts', 'wallet.ts',
            'walletRouter.ts'
        ],
        'server/_core/': [
            'advancedRateLimiter.ts', 'config.ts', 'context.ts', 'cookies.ts',
            'dataApi.ts', 'env.ts', 'errorHandler.ts', 'imageGeneration.ts',
            'index.ts', 'llm.ts', 'logger.ts', 'map.ts', 'notification.ts',
            'oauth.ts', 'sdk.ts', 'systemRouter.ts', 'trpc.ts', 'vite.ts',
            'voiceTranscription.ts'
        ],
        'server/_core/types/': [
            'cookie.d.ts', 'manusTypes.ts'
        ],
        'shared/': [
            'const.ts', 'types.ts'
        ],
        'shared/_core/': [
            'errors.ts'
        ],
        'drizzle/': [
            'schema.ts', 'relations.ts'
        ],
        'client/src/': [
            'App.tsx', 'main.tsx', 'index.css'
        ],
        'client/': [
            'index.html'
        ],
        'client/src/components/': [
            'DashboardLayout.tsx', 'DashboardLayoutSkeleton.tsx', 'ErrorBoundary.tsx'
        ]
    }

    deleted_count = 0
    moved_count = 0

    for target_dir, files in mapping.items():
        for filename in files:
            if os.path.exists(filename):
                target_path = os.path.join(target_dir, filename)
                if os.path.exists(target_path):
                    # Check if they are identical or if the root one is older/redundant
                    # For safety, if they exist in both places, we remove the root one
                    # as the project structure expects them in the subdirectories.
                    print(f"Removing duplicate: {filename} (already in {target_dir})")
                    os.remove(filename)
                    deleted_count += 1
                else:
                    print(f"Moving {filename} to {target_dir}")
                    os.rename(filename, target_path)
                    moved_count += 1

    print(f"Cleanup finished. Deleted: {deleted_count}, Moved: {moved_count}")

if __name__ == "__main__":
    cleanup()
