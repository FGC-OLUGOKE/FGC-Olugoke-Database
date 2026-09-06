import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { requestPasswordReset } from "./api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await requestPasswordReset(email.trim().toLowerCase());
      setMessage(response.detail);
    } catch (requestError) {
      setError(requestError.message || "Unable to request a password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </a>
        <div className="mt-8">
          <Mail className="h-8 w-8 text-[#154d78]" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="mt-2 text-sm text-gray-500">Enter your admin email to receive a reset link.</p>
        </div>
        {message ? <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p> : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <p className="rounded-lg bg-[#9e263b]/5 p-3 text-sm text-[#9e263b]">{error}</p>}
            <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Sending..." className="w-full">Send reset link</Button>
          </form>
        )}
      </div>
    </main>
  );
}
