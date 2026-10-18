import type { ElementType, ReactNode } from "react";
import { cn } from "~/lib/cn";

/** Site-width wrapper with the standard responsive gutters. */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}
