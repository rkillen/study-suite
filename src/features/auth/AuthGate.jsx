import { useAuth } from "../../context/AuthContext.jsx";
import MessageScreen from "./MessageScreen.jsx";
import NoAccessScreen from "./NoAccessScreen.jsx";
import SignInScreen from "./SignInScreen.jsx";

// Decides what to show: a setup message, the sign-in screen, "no access", or the app itself.
export default function AuthGate({ children }) {
  const { status, message, signOut } = useAuth();

  switch (status) {
    case "ready":
      return children;
    case "signedOut":
      return <SignInScreen />;
    case "denied":
      return <NoAccessScreen />;
    case "error":
      return (
        <MessageScreen
          title="Could not check your access"
          actions={[
            { label: "Try again", onClick: () => window.location.reload() },
            { label: "Sign out", onClick: signOut },
          ]}
        >
          <p>Check your internet connection and try again.</p>
          <p className="font-mono text-[11px] text-charcoal-400 break-words">{message}</p>
        </MessageScreen>
      );
    case "unconfigured":
      return (
        <MessageScreen title="Firebase is not set up yet">
          <p>
            Copy the file <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env</code> and fill in your Firebase settings, then restart
            the app. Step-by-step instructions are in <code className="font-mono text-xs">docs/SETUP-FIREBASE.md</code>.
          </p>
        </MessageScreen>
      );
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm font-mono text-charcoal-400">Loading Study Suite…</p>
        </div>
      );
  }
}
