// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Lock, User, Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { listTeachers } from "@/lib/invigilation.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s["next"] === "string" ? { next: s["next"] } : {},
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const rawNext = search?.next;
  const safeNext =
    rawNext && typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//") && rawNext !== "/auth"
      ? rawNext
      : "/dashboard";

  // Separate states for faculty and admin to prevent cross-tab form pollution
  const [facultyEmpId, setFacultyEmpId] = useState("");
  const [facultyPassword, setFacultyPassword] = useState("");
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);

  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    // Check if already logged in
    const mockUser = localStorage.getItem("mock_user");
    if (mockUser) {
      try {
        const u = JSON.parse(mockUser);
        if (u && (u.id || u.employee_id)) {
          navigate({ to: safeNext as any, replace: true });
          return;
        }
      } catch {
        localStorage.removeItem("mock_user");
      }
    }

    // Load mock teachers for demo
    listTeachers().then(setTeachers).catch(console.error);
  }, [navigate, safeNext]);

  async function handleFacultyLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const upperId = facultyEmpId.trim().toUpperCase();
      const teacher =
        teachers.find((t) => String(t.employee_id || "").toUpperCase() === upperId) ||
        teachers.find((t) => String(t.id || "").toUpperCase() === upperId);

      if (teacher && facultyPassword === teacher.password) {
        localStorage.setItem(
          "mock_user",
          JSON.stringify({
            ...teacher,
            role: "faculty",
          })
        );
        window.dispatchEvent(new Event("local-auth-change"));
        toast.success(`Welcome back, ${teacher.full_name}`);
        navigate({ to: safeNext as any, replace: true });
      } else {
        toast.error("Check the Employee ID and password.");
      }
    }, 600);
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (adminId.trim().toLowerCase() === "admin" && adminPassword === "admin123") {
        localStorage.setItem(
          "mock_user",
          JSON.stringify({
            id: "admin-1",
            full_name: "Super Admin",
            employee_id: "ADMIN",
            department: "Examination Cell",
            role: "admin",
          })
        );
        window.dispatchEvent(new Event("local-auth-change"));
        toast.success("Welcome, Administrator");
        navigate({ to: safeNext as any, replace: true });
      } else {
        toast.error("Invalid Admin credentials. Use admin / admin123");
      }
    }, 600);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary px-4 py-10 sm:py-12">
      <div className="glass-strong w-full max-w-md rounded-2xl p-5 sm:p-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <img src="/snpsu-logo.png" alt="Sapthagiri NPS University" className="size-16 object-contain mb-1" />
          <h1 className="font-display text-2xl font-bold text-foreground">UniDuty</h1>
          <p className="text-sm text-muted-foreground">Sign in to your university account</p>
        </div>

        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="faculty" className="text-xs sm:text-sm">Faculty Login</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs sm:text-sm">Admin Access</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty">
            <form onSubmit={handleFacultyLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="facultyEmpId">Employee ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="facultyEmpId"
                    placeholder="e.g. EMP1001"
                    value={facultyEmpId}
                    onChange={(e) => setFacultyEmpId(e.target.value)}
                    required
                    className="pl-9 bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facultyPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="facultyPassword"
                    type={showFacultyPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={facultyPassword}
                    onChange={(e) => setFacultyPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 bg-background/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showFacultyPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-3d mt-2" disabled={loading}>
                {loading ? "Authenticating..." : "Access Faculty Dashboard"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="adminId">Admin ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminId"
                    placeholder="admin"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    required
                    className="pl-9 bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminPassword"
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 bg-background/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-3d mt-2" disabled={loading}>
                {loading ? "Authenticating..." : "Enter Exam Cell"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
