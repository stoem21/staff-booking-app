import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/InlineError";
import { useAuth } from "@/providers/AuthProvider";

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => { if (user) navigate("/book", { replace: true }); }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr(error.message);
    else navigate("/book", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md pt-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold">Staff Login</div>
        <div className="mt-1 text-sm text-zinc-600">Email/password (Supabase Auth)</div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <InlineError message={err} />
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
        </form>

        <div className="mt-4 text-xs text-zinc-500">
          Add your auth user id into <code>public.staff_users</code> to pass RLS.
        </div>
      </div>
    </div>
  );
}
