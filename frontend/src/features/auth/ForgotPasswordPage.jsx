import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { requestPasswordReset } from "./api";



export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('sending')
    try {
      const data = await requestPasswordReset(email)
      setStatus('sent')
      setMessage(data.detail)
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }


  return (
    <main className="auth-card">
      <h1>Forgot your password?</h1>
      <p>Enter your email and we will send you a reset code.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
      {message && (
        <p className={status === 'error' ? 'message error' : 'message success'}>
          {message}
        </p>
      )}
      {status === 'sent' && <a href="/reset-password">Enter your reset code</a>}
    </main>
  )
}