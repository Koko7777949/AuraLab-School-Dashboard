"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      position="bottom-left"
      dir="rtl"
      toastOptions={{
        style: {
          background: '#1A1A24',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E4E4EC',
        },
      }}
    />
  )
}

export { Toaster }
