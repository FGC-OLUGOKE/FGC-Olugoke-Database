import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Logo from "../../assets/logo.svg";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (requestError) {
      if (requestError.status) {
        setError(`${requestError.message} (HTTP ${requestError.status})`);
      } else {
        setError("Cannot reach the backend API. Start Django on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-900/5">
          {/* Header Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#154d78] via-[#d6b447] to-[#154d78]" />

          <div className="p-8 sm:p-10">
            {/* Branding Header */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#154d78]/10 p-2 shadow-inner">
                {Logo ? (
                  <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-[#154d78]" />
                )}
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
                FGC Olugoke
              </h1>
              <p className="mt-1 text-sm font-medium text-gray-500">
                Member Management System
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="mt-8 space-y-5">
              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 p-3.5 text-xs text-[#9e263b]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#9e263b]" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@church.org"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-gray-700 focus:outline-none focus:ring-0"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a href="/forgot-password" className="text-sm font-medium text-[#154d78] hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#154d78] py-2.5 px-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#113e61] focus:outline-none focus:ring-2 focus:ring-[#154d78] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
