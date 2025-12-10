"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Countdown timer for locked state
  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((lockedUntil.getTime() - Date.now()) / 1000));
        setCountdown(remaining);

        if (remaining === 0) {
          setLockedUntil(null);
          setError("");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const handleSubmit = useCallback(async (pinToSubmit: string) => {
    if (loading || lockedUntil) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToSubmit })
      });

      const data = await res.json();

      if (res.ok) {
        // Success!
        setSuccess(true);
        if ("vibrate" in navigator) {
          navigator.vibrate([50, 50, 50]); // Success vibration
        }

        // Redirect after animation
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else {
        // Error
        if (data.lockedUntil) {
          setLockedUntil(new Date(data.lockedUntil));
          setError("Too many failed attempts");
        } else {
          setError(data.error || "Invalid PIN");
        }

        setPin("");
        setShake(true);

        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]); // Error vibration
        }

        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError("Connection error. Please try again.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }, [loading, lockedUntil, router]);

  const handleNumberClick = useCallback((num: string) => {
    setPin(prev => {
      if (prev.length < 6 && !loading && !success && !lockedUntil) {
        const newPin = prev + num;

        // Haptic feedback (if supported)
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }

        // Auto-submit when 6 digits
        if (newPin.length === 6) {
          setTimeout(() => handleSubmit(newPin), 100);
        }

        return newPin;
      }
      return prev;
    });
  }, [loading, success, lockedUntil, handleSubmit]);

  const handleBackspace = useCallback(() => {
    if (!loading && !success && !lockedUntil) {
      setPin(prev => prev.slice(0, -1));
      setError("");
    }
  }, [loading, success, lockedUntil]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || success || lockedUntil) return;

      if (e.key >= "0" && e.key <= "9") {
        handleNumberClick(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && pin.length === 6) {
        handleSubmit(pin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading, success, lockedUntil, handleNumberClick, handleBackspace, handleSubmit]);

  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"]
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden px-3 sm:px-6">
      {/* Glass Liquid Background - White Dominant with Blue Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-white">
        {/* Animated liquid blobs - Subtle blue on white */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-100/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-100/15 to-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-cyan-200/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Glass overlay - Very light */}
        <div className="absolute inset-0 backdrop-blur-[80px]" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md px-4 py-10 mx-auto sm:px-6 sm:py-12 z-10">
        {/* Glass Card */}
        <div className="relative">
          {/* Glow effect - Subtle blue glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 rounded-[3rem] blur-2xl opacity-20 animate-pulse-slow" />

          {/* Main glass card - White dominant */}
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl sm:rounded-[3rem] border border-blue-100/40 shadow-2xl p-6 sm:p-8">
            {/* Logo & Title */}
            <div className="text-center mb-10 animate-fade-in">
              <Image
                src="/logokpf.png"
                alt="KPF Logo"
                width={180}
                height={110}
                className="mx-auto mb-6 h-20 w-auto sm:h-24 object-contain drop-shadow-xl animate-scale-in"
                priority
              />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent mb-2">
                Dashboard OL
              </h1>
              <p className="text-slate-800 font-medium">ป้อนรหัส PIN 6 หลัก</p>
            </div>

            {/* PIN Dots */}
            <div className={`flex justify-center gap-3 sm:gap-4 mb-8 transition-all ${shake ? "animate-shake" : ""}`}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`relative transition-all duration-300 ${
                    i < pin.length ? "scale-125" : "scale-100"
                  }`}
                >
                  {/* Outer glow */}
                  {i < pin.length && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-60 animate-pulse" />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 ${
                      i < pin.length
                        ? success
                          ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50 border-2 border-white"
                          : "bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/50 border-2 border-white"
                        : "bg-blue-50 border-2 border-blue-200 backdrop-blur-sm"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-green-500/20 backdrop-blur-xl border-2 border-green-400/50 animate-scale-in">
                <div className="flex items-center justify-center gap-3 text-green-700">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">เข้าสู่ระบบสำเร็จ</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !success && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/20 backdrop-blur-xl border-2 border-red-400/50 animate-shake">
                <div className="flex items-center justify-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <div className="text-sm font-semibold">
                    {lockedUntil ? (
                      <>
                        ล็อคการเข้าสู่ระบบ
                        <div className="text-xs font-normal mt-1">
                          ลองใหม่ใน {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} นาที
                        </div>
                      </>
                    ) : (
                      error
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Number Pad - CIRCULAR BUTTONS */}
            <div className="mb-8 space-y-3 sm:space-y-4">
              {numbers.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-3 sm:gap-4">
                  {row.map((num, colIndex) => {
                    const isBackspace = num === "⌫";
                    const isEmpty = num === "";

                    if (isEmpty) {
                      return <div key={colIndex} className="w-20 h-20" />;
                    }

                    return (
                      <button
                        key={colIndex}
                        onClick={() => (isBackspace ? handleBackspace() : handleNumberClick(num))}
                        disabled={loading || success || !!lockedUntil}
                        className={`
                          relative w-16 h-16 sm:w-20 sm:h-20 rounded-full font-semibold text-xl sm:text-2xl overflow-hidden
                          transition-all duration-200 text-slate-900
                          bg-gradient-to-br from-white/60 via-white/25 to-blue-50/20
                          backdrop-blur-2xl border border-white/50
                          shadow-[0_12px_40px_-18px_rgba(59,130,246,0.55)]
                          hover:shadow-[0_15px_50px_-18px_rgba(59,130,246,0.75)]
                          ring-1 ring-white/30
                          active:scale-95
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                          flex items-center justify-center
                          group
                        `}
                      >
                        {/* Liquid glass sheen */}
                        <div
                          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            ${isBackspace ? "bg-gradient-to-br from-red-100/40 via-white/25 to-red-200/40" : "bg-gradient-to-br from-blue-100/35 via-white/20 to-cyan-100/35"}`}
                        />
                        {/* Moving highlight */}
                        <div className="absolute -top-10 left-0 right-0 h-12 bg-white/30 blur-xl transform rotate-12 group-hover:translate-y-14 transition-transform duration-300" />

                        <span className="relative z-10">{num}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Loading Spinner */}
            {loading && (
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin backdrop-blur-xl" />
              </div>
            )}

            {/* Help Text */}
            {!loading && !success && !lockedUntil && (
              <div className="text-center text-sm text-slate-700">
                <p>หากลืมรหัส PIN กรุณาติดต่อผู้ดูแลระบบ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shake {
          animation: shake 0.5s;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
