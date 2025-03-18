import React from 'react'

interface StatusMessageProps {
  status: { type: 'success' | 'error'; text: string } | null
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (!status) return null;

  return (
    <div
      className={`p-3 mb-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
    >
      {status.text}
    </div>
  )
} 