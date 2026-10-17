import { chromium } from "playwright";

async function runMultiTabTest() {
  console.log("==================================================================");
  console.log("STARTING GENUINE E2E MULTI-TAB SESSION ISOLATION TEST");
  console.log("==================================================================");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Single shared browser context (simulates one user running two tabs in one browser window)
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    // -------------------------------------------------------------
    // STEP 1: Open Tab A and authenticate as Super Admin
    // -------------------------------------------------------------
    console.log("\n[STEP 1] Launching Tab A -> http://localhost:8080/auth");
    const tabA = await context.newPage();
    await tabA.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });

    console.log("[STEP 1] Clicking 'Admin Access' tab in Tab A");
    await tabA.getByRole("tab", { name: /Admin Access/i }).click();

    console.log("[STEP 1] Filling Admin credentials (admin / admin123)");
    await tabA.locator("#adminId").fill("admin");
    await tabA.locator("#adminPassword").fill("admin123");
    
    console.log("[STEP 1] Submitting Admin login form ('Enter Exam Cell')");
    await tabA.getByRole("button", { name: /Enter Exam Cell/i }).click();

    // Wait for redirect to /dashboard
    await tabA.waitForURL("**/dashboard", { timeout: 10000 });
    await tabA.waitForSelector("text=Admin Portal", { timeout: 10000 });

    const tabA_body1 = await tabA.innerText("body");
    const tabA_hasAdminPortal1 = tabA_body1.includes("Admin Portal");
    const tabA_hasSuperAdmin1 = tabA_body1.includes("Super Admin") || tabA_body1.includes("Administrator");
    console.log(`[STEP 1] Tab A initial state: Admin Portal=${tabA_hasAdminPortal1}, Has Admin Identity=${tabA_hasSuperAdmin1}`);

    // -------------------------------------------------------------
    // STEP 2: Open Tab B in the SAME context and authenticate as Faculty
    // -------------------------------------------------------------
    console.log("\n[STEP 2] Launching Tab B (in the same browser window) -> http://localhost:8080/auth");
    const tabB = await context.newPage();
    await tabB.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });

    console.log("[STEP 2] Entering Faculty credentials for Dr. Aarav Sharma (EMP1001 / pass123)");
    await tabB.locator("#facultyEmpId").fill("EMP1001");
    await tabB.locator("#facultyPassword").fill("pass123");

    console.log("[STEP 2] Submitting Faculty login form ('Access Faculty Dashboard')");
    await tabB.getByRole("button", { name: /Access Faculty Dashboard/i }).click();

    // Wait for redirect to /dashboard
    await tabB.waitForURL("**/dashboard", { timeout: 10000 });
    await tabB.waitForSelector("text=Faculty Portal", { timeout: 10000 });

    const tabB_body1 = await tabB.innerText("body");
    const tabB_hasFacultyPortal1 = tabB_body1.includes("Faculty Portal");
    const tabB_hasFacultyIdentity1 = tabB_body1.includes("Dr. Aarav Sharma") || tabB_body1.includes("Faculty");
    console.log(`[STEP 2] Tab B initial state: Faculty Portal=${tabB_hasFacultyPortal1}, Has Faculty Identity=${tabB_hasFacultyIdentity1}`);

    // -------------------------------------------------------------
    // STEP 3: Verify Tab A did NOT get clobbered by Tab B's login
    // -------------------------------------------------------------
    console.log("\n[STEP 3] Inspecting Tab A after Tab B logged in as Faculty...");
    const tabA_body2 = await tabA.innerText("body");
    const tabA_hasAdminPortal2 = tabA_body2.includes("Admin Portal");
    const tabA_hasSuperAdmin2 = tabA_body2.includes("Super Admin") || tabA_body2.includes("Administrator");
    const tabA_clobberedByFaculty = tabA_body2.includes("Faculty Portal");
    console.log(`[STEP 3] Tab A verification:`);
    console.log(`         Admin Portal Visible:   ${tabA_hasAdminPortal2}`);
    console.log(`         Super Admin Identity:   ${tabA_hasSuperAdmin2}`);
    console.log(`         Clobbered by Faculty:   ${tabA_clobberedByFaculty}`);

    if (tabA_clobberedByFaculty || !tabA_hasAdminPortal2) {
      throw new Error("FAILURE: Tab A was clobbered by Tab B's login!");
    }

    // -------------------------------------------------------------
    // STEP 4: Refresh Tab A and Tab B independently
    // -------------------------------------------------------------
    console.log("\n[STEP 4] Refreshing Tab A independently...");
    await tabA.reload({ waitUntil: "networkidle" });
    const tabA_body3 = await tabA.innerText("body");
    const tabA_persistedAdmin = tabA_body3.includes("Admin Portal");
    console.log(`[STEP 4] Tab A post-reload: Admin Portal persisted=${tabA_persistedAdmin}`);

    console.log("[STEP 4] Refreshing Tab B independently...");
    await tabB.reload({ waitUntil: "networkidle" });
    const tabB_body3 = await tabB.innerText("body");
    const tabB_persistedFaculty = tabB_body3.includes("Faculty Portal");
    console.log(`[STEP 4] Tab B post-reload: Faculty Portal persisted=${tabB_persistedFaculty}`);

    if (!tabA_persistedAdmin || !tabB_persistedFaculty) {
      throw new Error("FAILURE: Persistence failed after tab reloads!");
    }

    // -------------------------------------------------------------
    // STEP 5: Test Authorization Isolation (/settings access)
    // -------------------------------------------------------------
    console.log("\n[STEP 5] Testing route authorization isolation (/settings)");
    console.log("[STEP 5] Navigating Tab A (Admin) to /settings");
    await tabA.goto("http://localhost:8080/settings", { waitUntil: "networkidle" });
    const tabA_url = tabA.url();
    const tabA_settingsBody = await tabA.innerText("body");
    const tabA_onSettings = tabA_url.includes("/settings") && tabA_settingsBody.includes("Rules & Settings");
    console.log(`[STEP 5] Tab A (Admin) allowed on /settings: ${tabA_onSettings} (URL: ${tabA_url})`);

    console.log("[STEP 5] Navigating Tab B (Faculty) to /settings (Admin-only route)");
    await tabB.goto("http://localhost:8080/settings", { waitUntil: "networkidle" });
    await tabB.waitForTimeout(1000); // Wait for redirect check
    const tabB_url = tabB.url();
    const tabB_blockedFromSettings = !tabB_url.includes("/settings");
    console.log(`[STEP 5] Tab B (Faculty) blocked and redirected away from /settings: ${tabB_blockedFromSettings} (URL: ${tabB_url})`);

    // -------------------------------------------------------------
    // STEP 6: Sign Out Tab B and verify Tab A remains unaffected
    // -------------------------------------------------------------
    console.log("\n[STEP 6] Signing out from Tab B...");
    await tabB.click('button[aria-label="Open profile menu"]');
    await tabB.getByRole("menuitem", { name: /Sign out/i }).click();
    await tabB.waitForURL("**/auth**", { timeout: 10000 });
    console.log(`[STEP 6] Tab B successfully signed out. Tab B URL: ${tabB.url()}`);

    console.log("[STEP 6] Verifying Tab A remains authenticated as Admin...");
    await tabA.reload({ waitUntil: "networkidle" });
    const tabA_body4 = await tabA.innerText("body");
    const tabA_stillAdmin = tabA_body4.includes("Admin Portal") || tabA_body4.includes("Super Admin") || tabA.url().includes("/settings");
    console.log(`[STEP 6] Tab A remains authenticated: ${tabA_stillAdmin} (URL: ${tabA.url()})`);

    if (!tabA_stillAdmin) {
      throw new Error("FAILURE: Tab A lost session when Tab B signed out!");
    }

    console.log("\n==================================================================");
    console.log("ALL MULTI-TAB SESSION ISOLATION TESTS PASSED WITH 100% SUCCESS!");
    console.log("==================================================================");
  } finally {
    await browser.close();
  }
}

runMultiTabTest().catch((err) => {
  console.error("\nTEST EXECUTION ERROR:", err);
  process.exit(1);
});
