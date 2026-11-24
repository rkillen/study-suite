import { Compass, Feather, Layers, Mic, Timer, Waves } from "lucide-react";
import Beachcombing from "./features/beachcombing/Beachcombing.jsx";
import Flashcards from "./features/flashcards/Flashcards.jsx";
import Overview from "./features/overview/Overview.jsx";
import PreOutlining from "./features/preoutlining/PreOutlining.jsx";
import SpeakingArena from "./features/speaking/SpeakingArena.jsx";
import Storycraft from "./features/storycraft/Storycraft.jsx";

// The list of tabs, in the order they appear. To add a tab, add a line here.
export const TABS = [
  { id: "overview", label: "Overview", icon: Compass, Component: Overview },
  { id: "beachcombing", label: "Beachcombing", icon: Waves, Component: Beachcombing },
  { id: "preoutlining", label: "Pre-Outlining", icon: Timer, Component: PreOutlining },
  { id: "storycraft", label: "Storycraft", icon: Feather, Component: Storycraft },
  { id: "speaking", label: "Speaking Arena", icon: Mic, Component: SpeakingArena },
  { id: "flashcards", label: "Flashcards", icon: Layers, Component: Flashcards },
];
