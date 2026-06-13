import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-white",
        secondary: "border-transparent bg-paper-deep text-ink",
        coastal: "border-transparent bg-coastal text-white",
        red: "border-transparent bg-irhal-red text-white",
        orange: "border-transparent bg-irhal-orange text-white",
        sky: "border-transparent bg-irhal-sky text-white",
        green: "border-transparent bg-irhal-green text-white",
        saffron: "border-transparent bg-saffron text-ink",
        outline: "border-ink/20 bg-white/70 text-ink",
        quiet: "border-transparent bg-white/15 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
