import * as React from "react"
import { cn } from "./utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-noir-900 uppercase tracking-widest">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-luxury border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-noir-900 placeholder:text-noir-500",
            "focus:outline-none focus:ring-2 focus:ring-foil-gold/30 focus:border-noir-900",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error && "border-status-warning focus:border-status-warning focus:ring-status-warning/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <span
            className={cn(
              "text-xs",
              error ? "text-status-warning" : "text-noir-500"
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
