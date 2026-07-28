import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]",
        navCta:
          "text-foreground bg-nav-button hover:bg-nav-button/80 active:scale-[0.97]",
        hero:
          "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97]",
        heroOutline:
          "bg-white text-background hover:brightness-90 active:scale-[0.97]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-transparent hover:bg-secondary hover:text-secondary-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm rounded-md",
        sm:      "h-8 px-3 text-xs rounded-md",
        lg:      "h-11 px-8 text-sm rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
