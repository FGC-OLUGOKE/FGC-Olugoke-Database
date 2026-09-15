import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Logo from "../../assets/logo.svg";
import { changePassword } from "./api";
import { useAuth } from "./AuthContext";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("error");
      setMessage("Please fill in all password fields.");
      return;
    }
    if (newPassword === currentPassword) {
      setStatus("error");
      setMessage("Your new password must be different from your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("The two new passwords do not match.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setStatus("done");
      setMessage("Password changed successfully. Redirecting to sign in...");
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We could not change your password.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#154d78] via-[#d6b447] to-[#154d78]" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#154d78]/10 p-2 shadow-inner">
                <img src={Logo} alt="FGC Olugoke logo" className="h-10 w-10 object-contain" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-gray-900">Change password</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your current password, then choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {message && (
                <div
                  role={status === "error" ? "alert" : "status"}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-sm ${
                    status === "error"
                      ? "border-[#9e263b]/20 bg-[#9e263b]/5 text-[#9e263b]"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {status === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}

              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((visible) => !visible)}
                autoComplete="current-password"
                toggleLabel={showCurrentPassword ? "Hide current password" : "Show current password"}
              />
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((visible) => !visible)}
                autoComplete="new-password"
                toggleLabel={showNewPassword ? "Hide new password" : "Show new password"}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
                autoComplete="new-password"
                toggleLabel={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              />

              <button
                type="submit"
                disabled={status === "saving" || status === "done"}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#154d78] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#113e61] focus:outline-none focus:ring-2 focus:ring-[#154d78] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving password...
                  </>
                ) : (
                  "Change password"
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mt-6 block w-full text-center text-sm font-medium text-[#154d78] hover:underline"
            >
              Back to profile
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete, toggleLabel }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
        {label}
      </label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-900 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-700"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
