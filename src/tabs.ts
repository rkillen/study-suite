import { lazy, type ComponentType } from "react";
import { Compass, Feather, Layers, Mic, ShieldCheck, Timer, Waves, type LucideIcon } from "lucide-react";
import Beachcombing from "./features/beachcombing/Beachcombing.tsx";
import Flashcards from "./features/flashcards/Flashcards.tsx";
import Overview from "./features/overview/Overview.tsx";
import PreOutlining from "./features/preoutlining/PreOutlining.tsx";
import SpeakingArena from "./features/speaking/SpeakingArena.tsx";
import Storycraft from "./features/storycraft/Storycraft.tsx";

// Loaded only when an admin opens the app, so clients never download it.
const AdminHome = lazy(() => import("./features/admin/AdminHome.tsx"));

/** One tab of the app. */
export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  Component: ComponentType;
  /** Shown to admins and nobody else. */
  adminOnly?: boolean;
}

// The list of tabs, in the order they appear. To add a tab, add a line here.
// A tab marked adminOnly is shown to admins and nobody else.
export const TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: Compass, Component: Overview },
  { id: "beachcombing", label: "Beachcombing", icon: Waves, Component: Beachcombing },
  { id: "preoutlining", label: "Pre-Outlining", icon: Timer, Component: PreOutlining },
  { id: "storycraft", label: "Storycraft", icon: Feather, Component: Storycraft },
  { id: "speaking", label: "Speaking Arena", icon: Mic, Component: SpeakingArena },
  { id: "flashcards", label: "Flashcards", icon: Layers, Component: Flashcards },
  { id: "admin", label: "Admin", icon: ShieldCheck, Component: AdminHome, adminOnly: true },
];

export const visibleTabs = (isAdmin: boolean): Tab[] => TABS.filter((tab) => isAdmin || !tab.adminOnly);
