import { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Logo from "../../assets/logo.svg";
import { confirmPasswordReset, setInitialPassword } from "./api";
import { useAuth } from "./AuthContext";

export default function ResetPasswordPage({ token = "", firstLogin = false }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { refresh } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("The two passwords do not match.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const data = firstLogin
        ? await setInitialPassword(newPassword, confirmPassword)
        : await confirmPasswordReset(token, newPassword, confirmPassword);
      setStatus("done");
      setMessage(data.detail);
      if (firstLogin) await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "We could not reset your password. Please request a new link.");
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
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-gray-900">
                {firstLogin ? "Set your password" : "Choose a new password"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {firstLogin
                  ? "Set a permanent password for your FGC Olugoke admin account."
                  : "Create a new password for your FGC Olugoke admin account."}
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

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  New password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-900 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((visible) => !visible)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-900 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "saving" || status === "done" || (!firstLogin && !token)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#154d78] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#113e61] focus:outline-none focus:ring-2 focus:ring-[#154d78] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving password...
                  </>
                ) : status === "done" ? (
                  "Password updated"
                ) : (
                  firstLogin ? "Set password" : "Reset password"
                )}
              </button>
            </form>

            <a
              href="/"
              className="mt-6 block text-center text-sm font-medium text-[#154d78] hover:underline"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
