"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 6 characters",
    test: (password) => password.length >= 6,
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Contains number",
    test: (password) => /\d/.test(password),
  },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  className 
}: PasswordStrengthIndicatorProps) {
  const [requirements, setRequirements] = useState(
    passwordRequirements.map(req => ({
      ...req,
      met: false,
    }))
  );

  useEffect(() => {
    setRequirements(
      passwordRequirements.map(req => ({
        ...req,
        met: req.test(password),
      }))
    );
  }, [password]);

  const allRequirementsMet = requirements.every(req => req.met);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-gray-700">
        Password Requirements:
      </div>
      <div className="space-y-2">
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center space-x-3 text-sm transition-all duration-300 ease-in-out",
              requirement.met
                ? "text-green-600"
                : "text-gray-500"
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out",
                requirement.met
                  ? "border-green-500 bg-green-500 shadow-sm"
                  : "border-gray-300 bg-white"
              )}
            >
              {requirement.met ? (
                <Check className="h-3 w-3 text-white" />
              ) : (
                <X className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <span className="font-medium">{requirement.label}</span>
          </div>
        ))}
      </div>
      
      {password && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">
              Password Strength:
            </div>
            <span
              className={cn(
                "text-sm font-semibold transition-colors duration-300",
                allRequirementsMet
                  ? "text-green-600"
                  : requirements.filter(r => r.met).length <= 2
                  ? "text-red-600"
                  : requirements.filter(r => r.met).length <= 3
                  ? "text-yellow-600"
                  : "text-green-600"
              )}
            >
              {allRequirementsMet
                ? "Strong"
                : requirements.filter(r => r.met).length <= 2
                ? "Weak"
                : requirements.filter(r => r.met).length <= 3
                ? "Fair"
                : "Good"}
            </span>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300 ease-in-out",
                  level <= requirements.filter(r => r.met).length
                    ? allRequirementsMet
                      ? "bg-green-500"
                      : level <= 2
                      ? "bg-red-500"
                      : level <= 3
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ConfirmPasswordIndicatorProps {
  password: string;
  confirmPassword: string;
  className?: string;
}

export function ConfirmPasswordIndicator({ 
  password, 
  confirmPassword, 
  className 
}: ConfirmPasswordIndicatorProps) {
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const hasConfirmPassword = confirmPassword.length > 0;

  if (!hasConfirmPassword) return null;

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out",
          passwordsMatch
            ? "border-green-500 bg-green-500 shadow-sm"
            : "border-red-500 bg-red-500 shadow-sm"
        )}
      >
        {passwordsMatch ? (
          <Check className="h-3 w-3 text-white" />
        ) : (
          <X className="h-3 w-3 text-white" />
        )}
      </div>
      <span
        className={cn(
          "text-sm font-semibold transition-all duration-300 ease-in-out",
          passwordsMatch ? "text-green-600" : "text-red-600"
        )}
      >
        {passwordsMatch ? "Passwords match" : "Passwords don't match"}
      </span>
    </div>
  );
}
