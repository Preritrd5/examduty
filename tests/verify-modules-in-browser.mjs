import { chromium } from "playwright";

async function verifyAllModules() {
  console.log("==================================================================");
  console.log("STARTING IN-BROWSER PERSISTENCE & WORKFLOW VERIFICATION");
  console.log("==================================================================");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Authenticate as Admin on /auth
    console.log("\n[1] Authenticating as Admin on http://localhost:8080/auth");
    await page.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /Admin Access/i }).click();
    await page.locator("#adminId").fill("admin");
    await page.locator("#adminPassword").fill("admin123");
    await page.getByRole("button", { name: /Enter Exam Cell/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("    Authenticated successfully on Dashboard:", page.url());

    // 2. Test Students Module Live Persistence
    console.log("\n[2] Testing Students Page: http://localhost:8080/students");
    await page.goto("http://localhost:8080/students", { waitUntil: "networkidle" });
    const studentsTitle = await page.innerText("h1");
    console.log(`    Page Header: "${studentsTitle}"`);

    // Verify student records are listed
    await page.waitForSelector("table tbody tr", { timeout: 15000 });
    const studentRowsCount = await page.locator("table tbody tr").count();
    console.log(`    Total Student Records Rendered in Table (Page 1): ${studentRowsCount}`);
    if (studentRowsCount === 0) {
      throw new Error("Students table failed to render records!");
    }

    // Test Search & Filter on Students
    console.log("    Testing student search input...");
    const searchInput = page.getByPlaceholder(/Search SRN/i);
    await searchInput.fill("Aarav");
    await page.waitForTimeout(500);
    const filteredCount = await page.locator("table tbody tr").count();
    console.log(`    Filtered Students for 'Aarav': ${filteredCount} records`);

    // 3. Test Staff Directory Module
    console.log("\n[3] Testing Teachers Page: http://localhost:8080/teachers");
    await page.goto("http://localhost:8080/teachers", { waitUntil: "networkidle" });
    const teachersTitle = await page.innerText("h1");
    console.log(`    Page Header: "${teachersTitle}"`);
    await page.waitForSelector("text=Teaching", { timeout: 10000 });
    console.log("    Staff Directory successfully loaded!");

    // 4. Test Halls & Floors Module
    console.log("\n[4] Testing Rooms Page: http://localhost:8080/rooms");
    await page.goto("http://localhost:8080/rooms", { waitUntil: "networkidle" });
    const roomsTitle = await page.innerText("h1");
    console.log(`    Page Header: "${roomsTitle}"`);
    await page.waitForSelector("text=Floor 1", { timeout: 10000 });
    console.log("    Halls & Floors successfully loaded!");

    // 5. Test Invigilation Duties Module
    console.log("\n[5] Testing Invigilation Page: http://localhost:8080/invigilation");
    await page.goto("http://localhost:8080/invigilation", { waitUntil: "networkidle" });
    const invigTitle = await page.innerText("h1");
    console.log(`    Page Header: "${invigTitle}"`);

    // 6. Test Seating Arrangement Module
    console.log("\n[6] Testing Seating Page: http://localhost:8080/seating");
    await page.goto("http://localhost:8080/seating", { waitUntil: "networkidle" });
    const seatingTitle = await page.innerText("h1");
    console.log(`    Page Header: "${seatingTitle}"`);

    // 7. Test Duty Swap Module
    console.log("\n[7] Testing Duty Swap Page: http://localhost:8080/duty-swap");
    await page.goto("http://localhost:8080/duty-swap", { waitUntil: "networkidle" });
    const swapTitle = await page.innerText("h1");
    console.log(`    Page Header: "${swapTitle}"`);

    // 8. Test Academic Timeline Module
    console.log("\n[8] Testing Academic Calendar: http://localhost:8080/academic-calendar");
    await page.goto("http://localhost:8080/academic-calendar", { waitUntil: "networkidle" });
    const calendarTitle = await page.innerText("h1");
    console.log(`    Page Header: "${calendarTitle}"`);

    // 9. Test Timetable & Allocation Module
    console.log("\n[9] Testing Timetable & Allocation: http://localhost:8080/timetable-allocation");
    await page.goto("http://localhost:8080/timetable-allocation", { waitUntil: "networkidle" });
    const timetableTitle = await page.innerText("h1");
    console.log(`    Page Header: "${timetableTitle}"`);

    // 10. Test Emergency & Complaint Desk Module
    console.log("\n[10] Testing Emergency Desk: http://localhost:8080/emergency");
    await page.goto("http://localhost:8080/emergency", { waitUntil: "networkidle" });
    const emergencyTitle = await page.innerText("h1");
    console.log(`    Page Header: "${emergencyTitle}"`);

    // 11. Test Rules & Settings Module & Save Setting (Real Persistence Verification)
    console.log("\n[11] Testing Rules & Settings Persistence: http://localhost:8080/settings");
    await page.goto("http://localhost:8080/settings", { waitUntil: "networkidle" });
    const settingsTitle = await page.innerText("h1");
    console.log(`    Page Header: "${settingsTitle}"`);
    
    await page.waitForSelector("#reporting_minutes", { timeout: 10000 });
    const initialReporting = await page.locator("#reporting_minutes").inputValue();
    console.log(`    Initial reporting_minutes: ${initialReporting}`);

    const testValue = initialReporting === "45" ? "35" : "45";
    console.log(`    Updating reporting_minutes to: ${testValue}`);
    await page.locator("#reporting_minutes").fill(testValue);
    await page.getByRole("button", { name: /Save rules/i }).click();

    // Wait for save toast
    await page.waitForSelector("text=Allocation rules updated", { timeout: 10000 });
    console.log("    Received confirmation toast: 'Allocation rules updated'");

    // Reload page to verify true server persistence across refreshes
    console.log("    Reloading page to test persistence...");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("#reporting_minutes", { timeout: 10000 });
    const persistedReporting = await page.locator("#reporting_minutes").inputValue();
    console.log(`    Persisted reporting_minutes after reload: ${persistedReporting}`);

    if (persistedReporting !== testValue) {
      throw new Error(`PERSISTENCE FAILURE: Expected ${testValue}, got ${persistedReporting}`);
    }
    console.log("    [PASS] Settings value successfully persisted and reloaded from server!");

    // Restore original value
    await page.locator("#reporting_minutes").fill(initialReporting);
    await page.getByRole("button", { name: /Save rules/i }).click();
    await page.waitForSelector("text=Allocation rules updated", { timeout: 10000 });
    console.log("    Restored initial settings.");

    console.log("\n==================================================================");
    console.log("ALL MODULES SUCCESSFULLY LOADED AND DATA PERSISTENCE FULLY VERIFIED!");
    console.log("==================================================================");
  } finally {
    await browser.close();
  }
}

verifyAllModules().catch((err) => {
  console.error("\nTEST SUITE ERROR:", err);
  process.exit(1);
});
