import { useState } from "react";
import { Check, Copy } from "lucide-react";

// What to send to someone you just invited, ready to copy. The invitation itself is already saved;
// the person only has to open the site and sign in with the invited Google account.
export default function InviteMessage({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Hello! You are invited to Study Suite. Open ${window.location.origin} and click "Sign in with Google", using the Google account ${email}.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-gold-100/60 border border-gold-300/60 space-y-2.5">
      <p className="text-xs font-medium text-charcoal-800">
        {email} is invited. Send them this message:
      </p>
      <p data-invite-message className="text-xs text-charcoal-800 leading-relaxed p-3 rounded-lg bg-white border border-alabaster-200">
        {message}
      </p>
      <button
        type="button"
        onClick={copy}
        className="px-3.5 py-2 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 flex items-center gap-1.5 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-gold-600" /> : <Copy className="w-3.5 h-3.5 text-gold-600" />}
        {copied ? "Copied" : "Copy message"}
      </button>
    </div>
  );
}
