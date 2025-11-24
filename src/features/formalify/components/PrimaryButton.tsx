import React from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
}

export function PrimaryButton({ className = '', isLoading, disabled, children, ...props }: PrimaryButtonProps) {
    return (
        <button
            disabled={disabled || isLoading}
            className={`
        group relative w-full h-[52px] md:h-[56px] lg:h-[60px] rounded-full 
        bg-gradient-to-r from-white to-gray-200 
        hover:from-white hover:to-white
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-3
        shadow-[0_0_20px_rgba(255,255,255,0.15)]
        hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]
        transition-all duration-300
        ${className}
      `}
            {...props}
        >
            <span className="text-black font-semibold text-[16px] md:text-[17px] tracking-tight">
                {isLoading ? 'Converting...' : children || 'Convert to Formal'}
            </span>

            {isLoading ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4 text-black" />
                </div>
            )}
        </button>
    )
}
