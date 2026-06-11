import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        slate: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        blue: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
        green: "border-transparent bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
        orange: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
        red: "border-transparent bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
