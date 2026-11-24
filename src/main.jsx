import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { StudyProvider } from "./context/StudyContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import AuthGate from "./features/auth/AuthGate.jsx";
import { StoryDraftProvider } from "./features/storycraft/StoryDraftContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <AuthGate>
          <StudyProvider>
            <StoryDraftProvider>
              <App />
            </StoryDraftProvider>
          </StudyProvider>
        </AuthGate>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);
