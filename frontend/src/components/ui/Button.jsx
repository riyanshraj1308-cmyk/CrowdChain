import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-ink-950 text-paper-50 hover:bg-ink-900 border border-ink-950",
  accent: "bg-copper-500 text-paper-50 hover:bg-copper-600 border border-copper-500",
  secondary: "bg-transparent text-ink-950 border border-ink-950/70 hover:bg-ink-950/5",
  ghost: "bg-transparent text-ink-900 border border-transparent hover:bg-ink-950/5",
  danger: "bg-transparent text-rust-500 border border-rust-500/60 hover:bg-rust-50",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

const Button = forwardRef(function Button(
  {
    as: Comp = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = "left",
    className = "",
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <motion.div
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className="inline-block"
    >
      <Comp
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`inline-flex select-none items-center justify-center rounded font-sans font-medium
          transition-colors duration-150 ease-out
          disabled:cursor-not-allowed disabled:opacity-40
          ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          Icon && iconPosition === "left" && <Icon className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{children}</span>
        {!loading && Icon && iconPosition === "right" && <Icon className="h-4 w-4" aria-hidden="true" />}
      </Comp>
    </motion.div>
  );
});

export default Button;
