import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn("rounded-xl px-3 py-2 text-sm font-medium",
      isActive ? "bg-white shadow border border-zinc-200" : "hover:bg-zinc-100"
    );

  return (
    <div className="min-h-full">
      <header className="no-print sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-zinc-900" />
            <div className="font-semibold">Staff Booking</div>
          </div>

          <nav className="flex items-center gap-1 rounded-2xl bg-zinc-100 p-1">
            <NavLink to="/book" className={linkClass}>Book</NavLink>
            <NavLink to="/manage" className={linkClass}>Manage</NavLink>
            <NavLink to="/summary" className={linkClass}>Summary</NavLink>
          </nav>

          <Button
            variant="outline"
            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
