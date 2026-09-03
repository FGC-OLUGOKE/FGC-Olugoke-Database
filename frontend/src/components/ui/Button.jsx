const VARIANTS = {
  primary: "bg-[#154d78] text-white hover:bg-[#123f61]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  danger: "bg-[#9e263b] text-white hover:bg-[#821f31]",
};

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}