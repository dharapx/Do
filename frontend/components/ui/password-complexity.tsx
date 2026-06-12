import { Check, X } from "lucide-react";

interface Rule {
  test: (pw: string) => boolean;
  label: string;
}

const RULES: Rule[] = [
  { test: (pw) => pw.length >= 8, label: "At least 8 characters" },
  { test: (pw) => /[A-Z]/.test(pw), label: "One uppercase letter" },
  { test: (pw) => /[a-z]/.test(pw), label: "One lowercase letter" },
  { test: (pw) => /\d/.test(pw), label: "One number" },
];

interface PasswordComplexityProps {
  password: string;
}

export function PasswordComplexity({ password }: PasswordComplexityProps) {
  if (!password) return null;

  return (
    <div className="space-y-1 mt-1">
      {RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div key={rule.label} className="flex items-center gap-1.5 text-xs">
            {passed ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-red-500 shrink-0" />
            )}
            <span className={passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return RULES.every((r) => r.test(password));
}
