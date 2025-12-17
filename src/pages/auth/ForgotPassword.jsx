import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../services/Api";
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.auth.forgotPassword({ email });
      toast.success("Reset link sent to your email.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/ELogo.png"
            alt="Erisn Logo"
            className="w-12 h-12 rounded-xl shadow-lg shadow-brand-red/30"
          />
          <span className="text-white font-bold text-2xl">ClockIn</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/50">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-brand-red hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
