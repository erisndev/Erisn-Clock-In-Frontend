import * as React from "react";

import { cn } from "../../src/lib/utils";

/**
 * App-styled spinner that matches the dark/glass UI.
 *
 * - Uses currentColor so it inherits text color.
 * - Default size is 16px (size-4).
 * - Primary accent arc is brand red; remaining track is subtle.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      className={cn("size-4 animate-spin text-brand-red", className)}
      {...props}
    >
      {/* Track */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />

      {/* Accent arc */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
        d="M 12 2 a 10 10 0 0 1 10 10"
      />
    </svg>
  );
}

export { Spinner };
