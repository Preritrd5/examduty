import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // 1. Check Supabase session
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {
      // Fallthrough
    }

    // 2. Check tab-isolated session (client-side)
    if (typeof window !== "undefined") {
      const { getTabSession } = await import("@/lib/auth-session");
      const session = getTabSession();
      if (session && (session.id || session.employee_id)) {
        return { user: session };
      }

      // No active session — redirect directly to /auth with next parameter
      const nextTarget =
        location.pathname !== "/auth"
          ? location.pathname + (location.searchStr || "")
          : "/dashboard";

      throw redirect({
        to: "/auth",
        search: { next: nextTarget },
      });
    }

    return {
      user: {
        id: "demo-admin-id",
        email: "admin@invigilateos.edu",
        user_metadata: { full_name: "Super Admin", department: "Examination Cell" },
      },
    };
  },
  component: () => <Outlet />,
});