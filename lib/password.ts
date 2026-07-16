/** Password rules for sign-up. */

export type PasswordRuleId =
  | "minLength"
  | "uppercase"
  | "number"
  | "special";

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: "One number",
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "One special character (!@#$%…)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function checkPasswordRules(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    ok: rule.test(password),
  }));
}

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/** First failing rule message, or null if strong. */
export function getPasswordError(password: string): string | null {
  if (!password) return "Enter a password.";
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (failed.length === 0) return null;
  if (failed.length === PASSWORD_RULES.length) {
    return "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
  }
  return `Password needs: ${failed.map((r) => r.label.toLowerCase()).join(", ")}.`;
}
