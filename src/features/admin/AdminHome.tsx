import { useState, type ComponentType } from "react";
import { useStudy } from "../../context/StudyContext.tsx";
import ClientsAdmin from "./ClientsAdmin.tsx";
import ImportBackup from "./ImportBackup.tsx";
import SharedContent from "./SharedContent.tsx";

// The sections of the Admin tab. To add one, add a line here.
const SECTIONS: { id: string; label: string; Component: ComponentType }[] = [
  { id: "content", label: "Shared content", Component: SharedContent },
  { id: "clients", label: "Clients", Component: ClientsAdmin },
  { id: "data", label: "Import & backup", Component: ImportBackup },
];

export default function AdminHome() {
  const { contentEmpty } = useStudy();
  // With no content yet, the first thing to do is import the starter data.
  const [sectionId, setSectionId] = useState(contentEmpty ? "data" : SECTIONS[0]!.id);
  const { Component } = SECTIONS.find((section) => section.id === sectionId)!;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal-900">Admin</h1>
          <p className="text-xs sm:text-sm text-charcoal-600">Manage the content everyone practises with.</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-alabaster-100 p-1 rounded-xl border border-alabaster-200 self-start">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSectionId(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                id === sectionId ? "bg-white text-crimson-700 shadow-2xs" : "text-charcoal-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Component />
    </section>
  );
}
