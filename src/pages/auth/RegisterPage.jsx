import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const DEPARTMENTS = [
  "Software Development",
  "Data Science",
  "UI/UX Design",
  "Project Management",
  "Quality Assurance",
  "DevOps",
  "Business Analysis",
  "Cybersecurity",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("graduate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const newUser = {
      id: Date.now(),
      name,
      email,
      cellNumber,
      role,
      ...(role === "graduate" && { department }),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // Store current user
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/graduate");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img src="/ELogo.png" alt="Erisn Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-brand-red/30" />
          <span className="text-white font-bold text-2xl">ClockIn</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-white/50">Get started with your free account today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="input-label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("graduate")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    role === "graduate"
                      ? "bg-brand-red text-white shadow-lg shadow-brand-red/25"
                      : "bg-white/[0.05] text-white/60 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Graduate
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    role === "admin"
                      ? "bg-brand-red text-white shadow-lg shadow-brand-red/25"
                      : "bg-white/[0.05] text-white/60 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="input-label">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="input-field"
              />
            </div>

            {/* Email */}
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

            {/* Cell Number */}
            <div>
              <label className="input-label">Cell number</label>
              <input
                type="tel"
                value={cellNumber}
                onChange={(e) => setCellNumber(e.target.value)}
                required
                placeholder="+27 12 345 6789"
                className="input-field"
              />
            </div>

            {/* Department - Only for graduates */}
            {role === "graduate" && (
              <div>
                <label className="input-label">Department</label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#1a1a1a] text-white/50">Select your department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-[#1a1a1a] text-white">{dept}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
              <p className="mt-1.5 text-xs text-white/40">Must be at least 8 characters</p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-brand-red focus:ring-brand-red/50"
              />
              <span className="text-sm text-white/50">
                I agree to the{" "}
                <a href="#" className="text-brand-red hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-brand-red hover:underline">Privacy Policy</a>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0d0d0d] text-white/40">or continue with</span>
            </div>
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary py-2.5 text-sm">
              <GoogleIcon className="w-4 h-4" />
              Google
            </button>
            <button className="btn-secondary py-2.5 text-sm">
              <MicrosoftIcon className="w-4 h-4" />
              Microsoft
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-red hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
