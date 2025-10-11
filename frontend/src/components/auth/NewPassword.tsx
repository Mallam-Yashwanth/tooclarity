"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { authAPI } from "@/lib/api";

export default function NewPassword() {
  const router = useRouter();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<{ password?: string; passwordConfirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: { password?: string; passwordConfirm?: string } = {};

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "Please confirm your password.";
    } else if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.resetPassword(token as string, {
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      });

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setErrors({ general: response.message || "Failed to reset password. Please try again." });
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Validate token exists
  if (!token || typeof token !== 'string') {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md border">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">Invalid or missing reset token. Please use the link from your email.</p>
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md border">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
        {success ? "Password Reset Successful" : "Reset Your Password"}
      </h2>
      <p className="text-gray-500 text-center mb-6 text-sm">
        {success
          ? "Your password has been successfully reset. You will be redirected to login shortly."
          : "Enter your new password below to reset it."
        }
      </p>

      {errors.general && !success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center mb-4">
          {errors.general}
        </div>
      )}

      {success ? (
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm mb-4">
            ✓ Password reset successful!
          </div>
          <p className="text-gray-600 text-sm">Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="New Password"
            name="password"
            type="password"
            placeholder="Enter new password (min 8 characters)"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setErrors({ ...errors, password: "" });
            }}
            required
            error={errors.password}
          />

          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            value={formData.passwordConfirm}
            onChange={(e) => {
              setFormData({ ...formData, passwordConfirm: e.target.value });
              setErrors({ ...errors, passwordConfirm: "" });
            }}
            required
            error={errors.passwordConfirm}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}
