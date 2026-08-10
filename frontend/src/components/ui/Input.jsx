export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20 ${className}`}
      />
    </label>
  );
}