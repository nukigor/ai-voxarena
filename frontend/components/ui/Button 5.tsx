import { forwardRef, ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const base = "inline-flex items-center justify-center font-medium rounded-xl transition focus:outline-none focus-visible:ring";
const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};
const variants = {
  primary: "bg-black text-white hover:opacity-90 focus-visible:ring-black/30",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-300",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100 focus-visible:ring-zinc-300",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={twMerge(base, sizes[size], variants[variant], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";