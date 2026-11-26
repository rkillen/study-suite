import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { StudyProvider } from "./context/StudyContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import AuthGate from "./features/auth/AuthGate.tsx";
import { StoryDraftProvider } from "./features/storycraft/StoryDraftContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </StrictMode>
);
