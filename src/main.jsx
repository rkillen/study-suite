import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { StudyProvider } from "./context/StudyContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { StoryDraftProvider } from "./features/storycraft/StoryDraftContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <StudyProvider>
        <StoryDraftProvider>
          <App />
        </StoryDraftProvider>
      </StudyProvider>
    </ToastProvider>
  </StrictMode>
);
