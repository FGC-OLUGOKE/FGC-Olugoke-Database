import { useState } from "react";
import { useAuth } from "./AuthContext";
export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Church Admin Login
          </h1>
          <p className="mt-1 text-sm text-gray-500">API test login</p>
        </div>
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && (
          <p
            role="alert"
            className="rounded bg-red-50 p-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          className="w-full rounded bg-[#154d78] p-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Testing API..." : "Sign in and test API"}
        </button>
        <p className="text-center text-xs text-gray-400">
          Backend: http://127.0.0.1:8000/api
        </p>
      </form>
    </main>
  );
}
