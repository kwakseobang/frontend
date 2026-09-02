const MIN_LENGTH = 8;
const SPECIAL_CHARS = /[^A-Za-z0-9]/;

/** Mirrors the rule the signup form states ("8자 이상, 특수문자 포함"). */
export const PASSWORD_RULE_HINT = `${MIN_LENGTH}자 이상, 특수문자 포함`;

/**
 * Client-side pre-check only — the backend is the authority on password rules and
 * will reject anything this misses. Returns null when the password looks acceptable.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `비밀번호는 ${MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (!SPECIAL_CHARS.test(password)) {
    return "비밀번호에 특수문자를 하나 이상 포함해주세요.";
  }
  return null;
}
