const MIN_LENGTH = 8;
const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;
// Mirrors the backend's exact special-character set (MemberRegisterRequest) rather than
// "anything non-alphanumeric" — a space or an accented/Korean character isn't special to
// the server, so treating it as such here would let the client pass what the server rejects.
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/** Mirrors the rule the signup form states ("8자 이상, 영문·숫자·특수문자 포함"). */
export const PASSWORD_RULE_HINT = `${MIN_LENGTH}자 이상, 영문·숫자·특수문자 포함`;

/**
 * Client-side pre-check only — the backend is the authority on password rules and
 * will reject anything this misses. Returns null when the password looks acceptable.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `비밀번호는 ${MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (!HAS_LETTER.test(password)) {
    return "비밀번호에 영문을 하나 이상 포함해주세요.";
  }
  if (!HAS_DIGIT.test(password)) {
    return "비밀번호에 숫자를 하나 이상 포함해주세요.";
  }
  if (!HAS_SPECIAL.test(password)) {
    return "비밀번호에 특수문자를 하나 이상 포함해주세요.";
  }
  return null;
}
