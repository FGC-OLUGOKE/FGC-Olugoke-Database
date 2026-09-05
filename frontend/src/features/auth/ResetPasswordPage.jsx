import { useState } from "react";
import { Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { confirmPasswordReset } from "./api";

export default function ResetPasswordPage() {
  const token = window.location.pathname.split("/").filter(Boolean).pop();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await confirmPasswordReset(token, password, confirmPassword);
      setMessage(response.detail);
    } catch (requestError) {
      const detail = requestError.data?.detail;
      setError(Array.isArray(detail) ? detail.join(" ") : requestError.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <Lock className="h-8 w-8 text-[#154d78]" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Set a new password</h1>
        {message ? <div className="mt-6 space-y-4"><p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p><a className="text-sm font-medium text-[#154d78] hover:underline" href="/">Return to sign in</a></div> : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <p className="rounded-lg bg-[#9e263b]/5 p-3 text-sm text-[#9e263b]">{error}</p>}
            <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Saving..." : "Reset password"}</Button>
          </form>
        )}
      </div>
    </main>
  );
}
