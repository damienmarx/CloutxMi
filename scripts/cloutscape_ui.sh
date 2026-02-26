#!/bin/bash
# CloutScape Guided UI (CloutScape for Dummies)
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/lib/utils.sh"

# Ensure whiptail is installed
if ! check_command whiptail; then
    sudo apt-get install -y whiptail >/dev/null 2>&1
fi

MENU_TITLE="CloutScape Guided Deployment"

while true; do
    CHOICE=$(whiptail --title "$MENU_TITLE" --menu "Choose an action:" 15 60 6 \
        "1" "Full Guided Deployment (Recommended)" \
        "2" "Update & Rebuild Project" \
        "3" "Configure Cloudflare Tunnel" \
        "4" "Check Environment Status" \
        "5" "View Logs" \
        "6" "Exit" 3>&1 1>&2 2>&3)

    case $CHOICE in
        1)
            bash "$(dirname "$0")/setup_master_v2.sh"
            read -p "Press Enter to return to menu..."
            ;;
        2)
            bash "$(dirname "$0")/auto_git.sh" update
            read -p "Press Enter to return to menu..."
            ;;
        3)
            DOMAIN=$(whiptail --inputbox "Enter your Cloudflare domain (e.g., casino.example.com):" 8 60 3>&1 1>&2 2>&3)
            if [ -n "$DOMAIN" ]; then
                source "$(dirname "$0")/lib/aliases.sh"
                cs-tunnel-setup "$DOMAIN"
            fi
            read -p "Press Enter to return to menu..."
            ;;
        4)
            bash "$(dirname "$0")/status_dashboard.sh"
            read -p "Press Enter to return to menu..."
            ;;
        5)
            tail -n 50 "$LOG_FILE"
            read -p "Press Enter to return to menu..."
            ;;
        6|*)
            exit 0
            ;;
    esac
done
