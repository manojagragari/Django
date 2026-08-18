"use client";

/** Form controls sharing one visual language and one error convention. */

import { useId } from "react";

import { SearchIcon } from "./Icons";
import { cx } from "./Primitives";

const CONTROL =
  "w-full rounded-[10px] border bg-app px-3 text-sm text-ink placeholder:text-faint " +
  "transition-colors outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed";

const CONTROL_HEIGHT = "h-10";

export function Field({ label, error, hint, required, children, className }) {
  return (
    <label className={cx("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline gap-1 text-xs font-semibold text-muted">
          {label}
          {required && <span className="text-negative">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-negative">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>
      )}
    </label>
  );
}

export function Input({ error, className, ...rest }) {
  return (
    <input
      aria-invalid={error ? "true" : undefined}
      className={cx(
        CONTROL,
        CONTROL_HEIGHT,
        error ? "border-negative" : "border-line-strong",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea({ error, className, rows = 3, ...rest }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={error ? "true" : undefined}
      className={cx(
        CONTROL,
        "py-2 leading-relaxed resize-y",
        error ? "border-negative" : "border-line-strong",
        className
      )}
      {...rest}
    />
  );
}

export function Select({ error, className, children, ...rest }) {
  return (
    <div className="relative">
      <select
        aria-invalid={error ? "true" : undefined}
        className={cx(
          CONTROL,
          CONTROL_HEIGHT,
          "appearance-none pr-9",
          error ? "border-negative" : "border-line-strong",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }) {
  const id = useId();
  return (
    <div className={cx("relative", className)}>
      <SearchIcon
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(CONTROL, CONTROL_HEIGHT, "border-line-strong pl-9")}
      />
    </div>
  );
}

/** Responsive form grid; children pick their own span with `sm:col-span-*`. */
export function FormGrid({ children, className, columns = 2 }) {
  const cols = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" };
  return (
    <div className={cx("grid grid-cols-1 gap-4", cols[columns] ?? cols[2], className)}>
      {children}
    </div>
  );
}
