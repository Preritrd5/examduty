export interface UserSession {
  id: string;
  employee_id?: string;
  full_name: string;
  department?: string;
  designation?: string;
  role: "admin" | "faculty";
  email?: string;
  phone?: string;
  office?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  duties?: number;
  block?: string;
  is_senior?: boolean;
}

const TAB_SESSION_KEY = "uniduty_tab_session_v1";

// Clean up any legacy shared origin storage once so old sessions don't bleed into fresh tabs
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("mock_user");
  } catch {}
}

/**
 * Reads the session strictly scoped to the current browser tab.
 * Uses sessionStorage as the exclusive source of truth so Tab A and Tab B maintain
 * completely independent authenticated accounts without any cross-tab interference.
 */
export function getTabSession(): UserSession | null {
  if (typeof window === "undefined") return null;

  try {
    const tabRaw = sessionStorage.getItem(TAB_SESSION_KEY);
    if (tabRaw) {
      const parsed = JSON.parse(tabRaw);
      if (parsed && (parsed.id || parsed.employee_id)) {
        return parsed as UserSession;
      }
    }
  } catch (err) {
    console.error("[AuthSession] Failed to read session", err);
  }

  return null;
}

/**
 * Stores the authenticated session for the CURRENT browser tab only.
 */
export function setTabSession(user: Partial<UserSession>): void {
  if (typeof window === "undefined") return;

  const sessionUser: UserSession = {
    id: user.id || user.employee_id || "user-1",
    employee_id: user.employee_id || user.id || "USER",
    full_name: user.full_name || "Faculty Member",
    department: user.department || "General",
    designation: user.designation || "Assistant Professor",
    role: user.role === "admin" ? "admin" : "faculty",
    email: user.email || "",
    phone: user.phone || "",
    office: user.office || "",
    avatar_url: user.avatar_url ?? null,
    banner_url: user.banner_url ?? null,
    duties: user.duties ?? 0,
    block: user.block || "A",
    is_senior: Boolean(user.is_senior),
  };

  const str = JSON.stringify(sessionUser);
  // Strictly write to current tab's sessionStorage
  sessionStorage.setItem(TAB_SESSION_KEY, str);

  // Dispatch event locally inside THIS window/tab only
  window.dispatchEvent(new CustomEvent("tab-auth-change", { detail: sessionUser }));
}

/**
 * Clears the session for the CURRENT browser tab only.
 * Does NOT affect other tabs running independent sessions.
 */
export function clearTabSession(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(TAB_SESSION_KEY);
  window.dispatchEvent(new CustomEvent("tab-auth-change", { detail: null }));
}

/**
 * Checks if the current tab is authenticated as Administrator.
 */
export function isTabAdmin(): boolean {
  const session = getTabSession();
  return session?.role === "admin";
}
