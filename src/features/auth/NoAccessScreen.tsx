import { useAuth } from "../../context/AuthContext.tsx";
import AuthLayout from "./AuthLayout.tsx";

const MESSAGES: Record<"not-invited" | "revoked", { title: string; text: (email: string) => string }> = {
  "not-invited": {
    title: "This account has not been invited",
    text: (email) =>
      `${email} is not on the invitation list. Ask your facilitator to invite this email address, or sign in with a different Google account.`,
  },
  revoked: {
    title: "Access has ended",
    text: (email) => `Access for ${email} has been turned off. Please contact your facilitator.`,
  },
};

export default function NoAccessScreen() {
  const auth = useAuth();
  if (auth.status !== "denied") return null;
  const { reason, email, signIn } = auth;
  const message = MESSAGES[reason];

  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h1 className="font-serif text-xl font-semibold text-charcoal-900">{message.title}</h1>
        <p className="text-sm text-charcoal-600 leading-relaxed">{message.text(email)}</p>
      </div>
      <button
        type="button"
        onClick={signIn}
        className="w-full px-4 py-3 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-medium transition-colors"
      >
        Use a different Google account
      </button>
    </AuthLayout>
  );
}
