import { Compass, Feather, Layers, Mic, ShieldCheck, Timer, Waves } from "lucide-react";
import AdminHome from "./features/admin/AdminHome.jsx";
import Beachcombing from "./features/beachcombing/Beachcombing.jsx";
import Flashcards from "./features/flashcards/Flashcards.jsx";
import Overview from "./features/overview/Overview.jsx";
import PreOutlining from "./features/preoutlining/PreOutlining.jsx";
import SpeakingArena from "./features/speaking/SpeakingArena.jsx";
import Storycraft from "./features/storycraft/Storycraft.jsx";

// The list of tabs, in the order they appear. To add a tab, add a line here.
// A tab marked adminOnly is shown to admins and nobody else.
export const TABS = [
  { id: "overview", label: "Overview", icon: Compass, Component: Overview },
  { id: "beachcombing", label: "Beachcombing", icon: Waves, Component: Beachcombing },
  { id: "preoutlining", label: "Pre-Outlining", icon: Timer, Component: PreOutlining },
  { id: "storycraft", label: "Storycraft", icon: Feather, Component: Storycraft },
  { id: "speaking", label: "Speaking Arena", icon: Mic, Component: SpeakingArena },
  { id: "flashcards", label: "Flashcards", icon: Layers, Component: Flashcards },
  { id: "admin", label: "Admin", icon: ShieldCheck, Component: AdminHome, adminOnly: true },
];

export const visibleTabs = (isAdmin) => TABS.filter((tab) => isAdmin || !tab.adminOnly);
