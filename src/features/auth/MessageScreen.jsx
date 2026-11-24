import AuthLayout from "./AuthLayout.jsx";

// A plain card with a title, some text and optional buttons: "loading", "not set up", "error".
// Each button is { label, onClick }.
export default function MessageScreen({ title, children, actions = [] }) {
  return (
    <AuthLayout>
      <div className="space-y-1.5">
        <h1 className="font-serif text-xl font-semibold text-charcoal-900">{title}</h1>
        <div className="text-sm text-charcoal-600 leading-relaxed space-y-2">{children}</div>
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {actions.map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="px-4 py-2.5 rounded-xl bg-alabaster-50 hover:bg-alabaster-100 border border-alabaster-200 text-xs font-medium text-charcoal-800 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </AuthLayout>
  );
}
