"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: ReactNode;
};

export function PendingButton({ children, pendingLabel, disabled, ...props }: PendingButtonProps) {
  const status = useFormStatus();
  const isDisabled = disabled || status.pending;

  return (
    <button {...props} disabled={isDisabled}>
      {status.pending ? pendingLabel ?? children : children}
    </button>
  );
}
