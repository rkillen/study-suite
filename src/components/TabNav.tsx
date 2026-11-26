import { Link } from "react-router";
import { useSignedIn } from "../context/AuthContext.tsx";
import { tabPath, useLinkTo } from "../lib/routing.ts";
import { visibleTabs } from "../tabs.ts";

export default function TabNav({ activeTab }: { activeTab: string }) {
  const { isAdmin } = useSignedIn();
  const linkTo = useLinkTo();

  return (
    <nav className="bg-alabaster-50 border-t border-alabaster-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5">
        {visibleTabs(isAdmin).map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to={linkTo(tabPath(id))}
            aria-current={id === activeTab ? "page" : undefined}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              id === activeTab ? "bg-crimson-700 text-white" : "text-charcoal-800 hover:bg-alabaster-200/70"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
