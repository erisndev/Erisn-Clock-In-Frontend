import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/Api";
import toast from "react-hot-toast";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const email = sessionStorage.getItem("pendingEmail");

    if (!email) {
      toast.error("No email found. Please register again.");
      setIsLoading(false);
      return;
    }

    try {
      await api.auth.verifyOtp({ email, otp });
      sessionStorage.removeItem("pendingEmail");
      toast.success("Email verified! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const email = sessionStorage.getItem("pendingEmail");
    if (!email) {
      toast.error("No email found.");
      return;
    }

    setIsResendLoading(true);
    try {
      await api.auth.resendOtp({ email });
      toast.success("New OTP sent to your email.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Verify Your Email
          </h1>
          <p className="text-white/50">Enter the OTP sent to your email!</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="input-label">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP"
                className="input-field"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResendOtp}
              disabled={isResendLoading}
              className="text-brand-red hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResendLoading ? "Sending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
