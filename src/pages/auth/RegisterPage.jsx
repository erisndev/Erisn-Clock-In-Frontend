import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/Api";
import toast from "react-hot-toast";

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

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("graduate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordValid = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
      password
    );
    if (!passwordValid) {
      toast.error(
        "Password must be at least 8 characters and include 1 uppercase, 1 number and 1 symbol."
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    // Build payload - only include province and department for graduates
    const payload = {
      name,
      email,
      password,
      role,
      cellNumber,
    };
    
    if (role === "graduate") {
      payload.department = department;
      payload.province = province;
    }
    
    console.log("Register payload:", payload);

    try {
      await api.auth.register(payload);
      sessionStorage.setItem("pendingEmail", email);

      navigate("/verify-otp");
    } catch (error) {
      if (error.data?.errors) {
        error.data.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-6">
          <img
            src="/ELogo.png"
            alt="Erisn Logo"
            className="w-10 h-10 rounded-xl shadow-lg shadow-brand-red/30"
          />
          <span className="text-white font-bold text-xl">ClockIn</span>
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            Create an account
          </h1>
          <p className="text-white/50 text-sm">
            Get started with your free account today
          </p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="input-label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("graduate")}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
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
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    role === "admin"
                      ? "bg-brand-red text-white shadow-lg shadow-brand-red/25"
                      : "bg-white/[0.05] text-white/60 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Two-column grid for fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Province and Department - Only for graduates */}
              {role === "graduate" && (
                <>
                  <div>
                    <label className="input-label">Province</label>
                    <div className="relative">
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        required
                        className="input-field appearance-none cursor-pointer"
                      >
                        <option
                          value=""
                          disabled
                          className="bg-[#1a1a1a] text-white/50"
                        >
                          Select province
                        </option>
                        {PROVINCES.map((prov) => (
                          <option
                            key={prov}
                            value={prov}
                            className="bg-[#1a1a1a] text-white"
                          >
                            {prov}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Department</label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                        className="input-field appearance-none cursor-pointer"
                      >
                        <option
                          value=""
                          disabled
                          className="bg-[#1a1a1a] text-white/50"
                        >
                          Select your department
                        </option>
                        {DEPARTMENTS.map((dept) => (
                          <option
                            key={dept}
                            value={dept}
                            className="bg-[#1a1a1a] text-white"
                          >
                            {dept}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white"
                  >
                    <EyeIcon open={showPassword} className="w-5 h-5 " />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white"
                  >
                    <EyeIcon open={showConfirmPassword} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Password requirements - compact inline */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <PasswordRule label="8+ chars" ok={password.length >= 8} />
              <PasswordRule label="Uppercase" ok={/[A-Z]/.test(password)} />
              <PasswordRule label="Number" ok={/\d/.test(password)} />
              <PasswordRule label="Symbol" ok={/[^A-Za-z0-9]/.test(password)} />
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
                <a href="#" className="text-brand-red hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-brand-red hover:underline">
                  Privacy Policy
                </a>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0d0d0d] text-white/40">
                or continue with
              </span>
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

        <p className="mt-5 text-center text-sm text-white/50">
          Already have an account?{" "}
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

/* ---------- Helper Components ---------- */

function PasswordRule({ label, ok }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={
          "inline-block h-2 w-2 rounded-full " +
          (ok ? "bg-emerald-400" : "bg-white/20")
        }
      />
      <span className={ok ? "text-emerald-400" : "text-white/40"}>{label}</span>
    </span>
  );
}

function EyeIcon({ open, className }) {
  if (open) {
    // Eye open
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    );
  }
  // Eye closed (slash)
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.057 5.065 7 9.542 7 1.772 0 3.433-.41 4.89-1.137m2.858-2.07A10.478 10.478 0 0021.542 12c-1.274-4.057-5.065-7-9.542-7-1.183 0-2.32.177-3.39.5M3 3l18 18"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}
