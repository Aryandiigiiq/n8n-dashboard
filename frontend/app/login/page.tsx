'use client'

import React, { useState, useEffect } from 'react'
import styles from './page.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Redirect to /posts if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        window.location.href = '/posts'
      }
    }
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      // Format the request payload for OAuth2PasswordRequestForm
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      // Query the backend login API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
      )

      if (!response.ok) {
        throw new Error('Could not connect to authentication server.')
      }

      const data = await response.json()

      if (typeof window !== 'undefined' && data.access_token) {
        localStorage.setItem('token', data.access_token)
        window.location.href = '/posts'
      } else {
        throw new Error('Authentication failed.')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email address or password.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <p className={styles.eyebrow}>Secure Login</p>
          <h1 className={styles.loginTitle}>DigiIQ Channel</h1>
          <p className={styles.loginSubtitle}>Access your social automation feed</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.fieldLabel}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.fieldLabel}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputField}
                required
              />
              <button
                type="button"
                className={styles.viewPasswordBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? 'Authenticating…' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
