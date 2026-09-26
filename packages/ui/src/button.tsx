import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "./utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger"
  size?: "sm" | "md" | "lg" | "xl"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const variants = {
      primary: "bg-noir-950 text-cream-50 hover:bg-noir-800",
      secondary: "bg-cream-100 text-noir-900 border border-cream-300 hover:bg-cream-200",
      ghost: "hover:bg-cream-100 text-noir-900",
      accent: "bg-foil-gold text-noir-950 hover:opacity-90",
      danger: "bg-status-warning text-white hover:opacity-90"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      xl: "h-14 px-8 text-lg"
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-luxury uppercase tracking-[0.15em] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
