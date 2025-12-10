import { motion } from "framer-motion";

export default function ClockButton({ onClick, disabled, children, variant = "primary" }) {
  const variants = {
    primary: "bg-gradient-to-r from-brand-red to-red-600 shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/30",
    secondary: "bg-white/10 border border-white/10 hover:bg-white/15",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        ${variants[variant]}
        text-white font-semibold py-4 px-8 rounded-2xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
      `}
    >
      {children}
    </motion.button>
  );
}
