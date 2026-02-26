import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, AlertCircle } from "lucide-react";
import "./TermsModal.css";

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  title?: string;
  content?: string;
  showDegenCode?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  title = "Terms & Conditions",
  content,
  showDegenCode = false
}) => {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    setScrolledToBottom(isAtBottom);
  };

  const defaultContent = showDegenCode
    ? `
# Degens♧Den: The Code of the Clout

## I. Professionally Degenerate Rules

1. **High Stakes Only**: Go Big or Go Home. This ain't your grandma's bingo night.
2. **Respect the Rain**: Honor the Pump. When blessed with a Rain event, participate and share the wealth.
3. **No Paper Hands**: Diamond Hands Only. Volatility is the spice of life.
4. **Embrace the Chaos**: This Den thrives on calculated risks and unpredictable swings.
5. **Stack Gains, Stay Savage**: Celebrate wins, learn from losses, always strive for more.
6. **The House Always Wins... Eventually**: Play smart, manage your bankroll wisely.

## II. Terms & Conditions

By entering the Degens♧Den and utilizing CloutScape, you agree to:

- You must be at least 18 years of age or the legal gambling age in your jurisdiction.
- It is your sole responsibility to ensure participation is legal in your jurisdiction.
- You are solely responsible for maintaining account confidentiality.
- Any attempts at cheating or exploiting bugs will result in permanent banishment.
- All disputes will be handled by the CloutScape Admin Council.
- CloutScape provides services "as is" with no liability for losses.
- Participation in Refer-a-Degen program is subject to specific terms.

By proceeding, you acknowledge that you have read and understood these terms.
    `
    : content;

  if (!isOpen) return null;

  return (
    <div className="terms-modal-overlay">
      <Card className="terms-modal-card">
        {/* Header */}
        <div className="terms-modal-header">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReject}
            className="text-zinc-400 hover:text-white"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Content */}
        <div className="terms-modal-content" onScroll={handleScroll}>
          <div className="prose prose-invert max-w-none">
            {defaultContent.split("\n").map((line, idx) => {
              if (line.startsWith("# ")) {
                return (
                  <h1 key={idx} className="text-2xl font-bold text-red-400 mt-4 mb-2">
                    {line.replace("# ", "")}
                  </h1>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-cyan-400 mt-3 mb-2">
                    {line.replace("## ", "")}
                  </h2>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <p key={idx} className="text-zinc-300 ml-4 my-1">
                    • {line.replace("- ", "")}
                  </p>
                );
              }
              if (line.startsWith("1. ") || line.match(/^\d+\. /)) {
                return (
                  <p key={idx} className="text-zinc-300 ml-4 my-1">
                    {line}
                  </p>
                );
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <p key={idx} className="text-white font-bold my-2">
                    {line.replace(/\*\*/g, "")}
                  </p>
                );
              }
              return line.trim() ? (
                <p key={idx} className="text-zinc-300 my-2">
                  {line}
                </p>
              ) : null;
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        {!scrolledToBottom && (
          <div className="terms-modal-scroll-hint">
            <p className="text-xs text-zinc-500">Scroll to read all terms</p>
          </div>
        )}

        {/* Footer */}
        <div className="terms-modal-footer">
          <div className="flex items-center gap-3">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
              className="border-zinc-600"
            />
            <label htmlFor="accept-terms" className="text-sm text-zinc-300 cursor-pointer">
              I have read and agree to the terms and conditions
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onReject}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-900"
            >
              Decline
            </Button>
            <Button
              onClick={onAccept}
              disabled={!accepted}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold disabled:opacity-50"
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TermsModal;
