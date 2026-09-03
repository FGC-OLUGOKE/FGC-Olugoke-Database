export default function SectionCard({ title, actionLabel, onAction, headerContent, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {headerContent}
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-sm font-medium text-[#154d78] hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}