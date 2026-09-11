import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import Logo from "../../assets/logo.svg";
import { confirmPasswordReset } from "./api";

export default function ResetPasswordPage({ token = "" }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

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
      const data = await confirmPasswordReset(token, newPassword, confirmPassword);
      setStatus("done");
      setMessage(data.detail);
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
                Choose a new password
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Create a new password for your FGC Olugoke admin account.
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
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
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
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "saving" || status === "done" || !token}
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
                  "Reset password"
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
