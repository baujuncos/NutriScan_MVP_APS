export const MIN_PASSWORD_LENGTH = 8;

const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;

export type PasswordRuleStatus = {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
};

export function getPasswordRuleStatus(password: string): PasswordRuleStatus {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
  };
}

export function getPasswordValidationErrors(password: string): string[] {
  const status = getPasswordRuleStatus(password);
  const errors: string[] = [];

  if (!status.minLength) errors.push('La contraseña debe tener al menos 8 caracteres.');
  if (!status.hasUppercase) errors.push('La contraseña debe incluir al menos 1 mayúscula.');
  if (!status.hasLowercase) errors.push('La contraseña debe incluir al menos 1 minúscula.');
  if (!status.hasNumber) errors.push('La contraseña debe incluir al menos 1 número.');

  return errors;
}

export function isPasswordStrong(password: string): boolean {
  const status = getPasswordRuleStatus(password);
  return status.minLength && status.hasUppercase && status.hasLowercase && status.hasNumber;
}
