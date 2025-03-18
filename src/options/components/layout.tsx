import React, { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      {children}
    </div>
  )
} 