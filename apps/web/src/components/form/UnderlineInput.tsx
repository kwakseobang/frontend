"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./UnderlineInput.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  as?: "input";
  serif?: boolean;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: "textarea";
  serif?: boolean;
};

export function UnderlineInput(props: InputProps | TextareaProps) {
  const { as = "input", serif, className, ...rest } = props;
  const cls = [styles.input, serif ? styles.serif : "", className].filter(Boolean).join(" ");

  if (as === "textarea") {
    return <textarea className={cls} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />;
  }
  return <input className={cls} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
}
