import { useState } from "react";
import { Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { confirmPasswordReset } from "./api";



export default function ResetPassword() {
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('The two passwords do not match.')
      return
    }
    setStatus('saving')
    try {
      const data = await confirmPasswordReset({ code, newPassword })
      setStatus('done')
      setMessage(data.detail)
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <main className="auth-card">
      <h1>Choose a new password</h1>
      <p>Enter the reset code from the email we sent you.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="code">Reset code</label>
        <input
          id="code"
          type="text"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={status === 'saving' || status === 'done'}>
          {status === 'saving' ? 'Saving…' : 'Reset password'}
        </button>
      </form>
      {message && (
        <p className={status === 'error' ? 'message error' : 'message success'}>
          {message}
        </p>
      )}
    </main>
  )
}