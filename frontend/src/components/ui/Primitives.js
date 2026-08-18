"use client";

/** Voltline primitives: buttons, surfaces, badges, stat tiles, empty/loading states. */

import { AlertIcon, CheckIcon, InfoIcon, TrendDownIcon, TrendUpIcon } from "./Icons";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Button                                                            */
/* ------------------------------------------------------------------ */
const BUTTON_VARIANTS = {
  primary:
    "bg-accent text-accent-ink hover:brightness-110 active:brightness-95 border border-transparent",
  secondary:
    "bg-raised text-ink border border-line-strong hover:border-accent hover:text-accent",
  ghost:
    "bg-transparent text-muted border border-transparent hover:bg-raised hover:text-ink",
  danger:
    "bg-transparent text-negative border border-negative/40 hover:bg-negative hover:text-white",
  solidDanger: "bg-negative text-white border border-transparent hover:brightness-110",
};

const BUTTON_SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  children,
  className,
  ...rest
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center rounded-[10px] font-semibold whitespace-nowrap",
        "transition-all duration-150 select-none",
        "disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100",
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
        BUTTON_SIZES[size] ?? BUTTON_SIZES.md,
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="vl-spin h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={size === "sm" ? 14 : 16} />
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                          */
/* ------------------------------------------------------------------ */
export function Card({ className, children, current = false, ...rest }) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[14px] border border-line bg-surface vl-shadow-sm",
        className
      )}
      {...rest}
    >
      {current && <span className="vl-current" aria-hidden="true" />}
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
            <Icon size={17} />
          </span>
        )}
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cx("p-5", className)}>{children}</div>;
}

export function SectionTitle({ children, hint }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.09em] text-faint">{children}</h3>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                             */
/* ------------------------------------------------------------------ */
const BADGE_TONES = {
  neutral: "bg-raised text-muted border-line-strong",
  accent: "bg-accent-soft text-accent border-transparent",
  positive: "bg-transparent text-positive border-positive/35",
  negative: "bg-transparent text-negative border-negative/35",
  warning: "bg-transparent text-warning border-warning/40",
  info: "bg-transparent text-info border-info/35",
};

export function Badge({ tone = "neutral", children, className, icon: Icon }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
        className
      )}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                         */
/* ------------------------------------------------------------------ */
export function StatCard({
  label,
  value,
  hint,
  delta,
  tone = "neutral",
  icon: Icon,
  loading = false,
}) {
  const deltaPositive = typeof delta === "number" && delta >= 0;
  const accentText = {
    neutral: "text-ink",
    positive: "text-positive",
    negative: "text-negative",
    accent: "text-accent",
    warning: "text-warning",
  }[tone];

  return (
    <Card className="p-4" current>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">{label}</p>
        {Icon && (
          <span className="text-faint">
            <Icon size={16} />
          </span>
        )}
      </div>

      {loading ? (
        <div className="vl-skeleton mt-3 h-7 w-24 rounded-md" />
      ) : (
        <p className={cx("mt-2 text-2xl font-bold tracking-tight tabular-nums", accentText)}>
          {value}
        </p>
      )}

      <div className="mt-1.5 flex items-center gap-2">
        {typeof delta === "number" && !loading && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold",
              deltaPositive ? "text-positive" : "text-negative"
            )}
          >
            {deltaPositive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate text-[11px] text-faint">{hint}</span>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts                                                            */
/* ------------------------------------------------------------------ */
const ALERT_TONES = {
  error: { cls: "border-negative/35 text-negative", Icon: AlertIcon },
  success: { cls: "border-positive/35 text-positive", Icon: CheckIcon },
  info: { cls: "border-info/35 text-info", Icon: InfoIcon },
  warning: { cls: "border-warning/40 text-warning", Icon: AlertIcon },
};

export function Alert({ tone = "info", title, children, onDismiss }) {
  const { cls, Icon } = ALERT_TONES[tone] ?? ALERT_TONES.info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex items-start gap-2.5 rounded-[10px] border bg-surface px-3.5 py-3", cls)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && "mt-0.5", "text-ink/80")}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-current opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / loading                                                   */
/* ------------------------------------------------------------------ */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon size={22} />
        </span>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, ...rest }) {
  return <div className={cx("vl-skeleton rounded-md", className)} {...rest} />;
}

export function Spinner({ size = 18, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span
        className="vl-spin rounded-full border-2 border-current border-t-transparent"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-xs">{label}</span>}
    </span>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
