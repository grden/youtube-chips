import React, { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="flex flex-col max-h-[420px] w-[340px] relative">
            {children}
        </div>
    )
}

export function ContentArea({ children }: LayoutProps) {
    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {children}
        </div>
    )
} 