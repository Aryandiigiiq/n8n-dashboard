'use client'

import { useEffect } from 'react'

export default function RootPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      window.location.href = token ? '/posts' : '/login'
    }
  }, [])

  return null
}