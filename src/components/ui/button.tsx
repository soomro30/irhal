import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-coastal text-white shadow-sm hover:bg-ink",
        coastal: "bg-coastal text-white shadow-sm hover:bg-ink",
        red: "bg-irhal-red text-white shadow-sm hover:bg-ink",
        orange: "bg-irhal-orange text-white shadow-sm hover:bg-irhal-red",
        green: "bg-irhal-green text-white shadow-sm hover:bg-ink",
        blue: "bg-irhal-blue text-white shadow-sm hover:bg-ink",
        saffron: "bg-saffron text-ink shadow-sm hover:bg-date hover:text-white",
        outline:
          "border border-ink/20 bg-white/70 text-ink hover:border-ink hover:bg-white",
        ghost: "text-ink hover:bg-paper-deep",
        quiet:
          "border border-white/60 bg-white/10 text-white backdrop-blur hover:bg-white/20",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
