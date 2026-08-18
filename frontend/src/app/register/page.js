"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Alert, Button, Card } from "@/components/ui/Primitives";
import { Field, Input, Select } from "@/components/ui/Form";
import { BoltIcon } from "@/components/ui/Icons";

const ROLE_HELP = {
  Admin: "Full access, including deleting products, sales and expenses.",
  Staff: "Can record sales, expenses and stock, but cannot delete records.",
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({ username: "", password: "", confirm: "", group: "Staff" });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    api.auth
      .groups()
      .then((data) => {
        if (!cancelled) setGroups(data.map((row) => row.name));
      })
      .catch(() => {
        // The backend seeds Admin/Staff, so fall back rather than blocking signup.
        if (!cancelled) setGroups(["Admin", "Staff"]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: "Passwords do not match." });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        group: form.group,
      });
      router.replace("/dashboard");
    } catch (caught) {
      if (caught instanceof ApiError) {
        const flattened = {};
        Object.entries(caught.errors || {}).forEach(([key, value]) => {
          flattened[key] = Array.isArray(value) ? value.join(" ") : String(value);
        });
        setFieldErrors(flattened);
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <Link href="/login" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
            <BoltIcon size={18} />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">ElectroShop</span>
        </Link>
        <ThemeToggle />
      </div>

      <Card current className="w-full max-w-md p-6 sm:p-7">
        <h1 className="text-xl font-bold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Pick a role to set what you can do in the shop.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}

          <Field label="Username" required error={fieldErrors.username}>
            <Input
              autoComplete="username"
              autoFocus
              required
              value={form.username}
              onChange={update("username")}
              error={fieldErrors.username}
              placeholder="choose a username"
            />
          </Field>

          <Field
            label="Password"
            required
            error={fieldErrors.password}
            hint="At least 8 characters, not entirely numeric."
          >
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              error={fieldErrors.password}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Confirm password" required error={fieldErrors.confirm}>
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={update("confirm")}
              error={fieldErrors.confirm}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Role" required error={fieldErrors.group} hint={ROLE_HELP[form.group]}>
            <Select value={form.group} onChange={update("group")} error={fieldErrors.group}>
              {(groups.length ? groups : ["Admin", "Staff"]).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full"
            disabled={!form.username.trim() || !form.password || !form.confirm}
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
