// A titled card with an icon, used for the separate jobs on the Admin screens.
export default function AdminCard({ icon: Icon, title, children }) {
  return (
    <div className="studio-card rounded-2xl p-6 space-y-4 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-600 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold text-charcoal-900">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export const primaryButton =
  "px-4 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-medium transition-colors disabled:opacity-60";
export const secondaryButton =
  "px-4 py-2.5 rounded-xl bg-white hover:bg-alabaster-50 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors disabled:opacity-60";
