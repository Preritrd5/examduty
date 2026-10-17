import { chromium } from "playwright";

async function runDutyAndFormsVerification() {
  console.log("==================================================================");
  console.log("STARTING DUTY SCHEDULE, EMPTY STATE, SWAP & FORMS VERIFICATION");
  console.log("==================================================================");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Faculty with assigned duties (Dr. Aarav Sharma - EMP1001)
    // -------------------------------------------------------------------------
    console.log("\n[1] Testing Faculty EMP1001 (Dr. Aarav Sharma) - Duty Schedule Display");
    const ctxFaculty1 = await browser.newContext();
    const pageFaculty1 = await ctxFaculty1.newPage();
    await pageFaculty1.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });

    await pageFaculty1.locator("#facultyEmpId").fill("EMP1001");
    await pageFaculty1.locator("#facultyPassword").fill("pass123");
    await pageFaculty1.getByRole("button", { name: /Access Faculty Dashboard/i }).click();
    await pageFaculty1.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("    Logged in as EMP1001 on Dashboard:", pageFaculty1.url());

    // Wait for schedule card to load
    await pageFaculty1.waitForSelector("text=My Duty Schedule", { timeout: 10000 });
    const hasActiveDuty = await pageFaculty1.locator("text=Active Duty").count();
    console.log(`    Active Duty Badge visible for EMP1001: ${hasActiveDuty > 0}`);
    if (hasActiveDuty === 0) {
      throw new Error("EMP1001 should have an active duty card rendered!");
    }
    const dutyHall = await pageFaculty1.locator("text=Block A").first().innerText();
    console.log(`    Duty Hall rendered for EMP1001: "${dutyHall}"`);

    // -------------------------------------------------------------------------
    // TEST 2: Faculty with NO assigned duties (EMP1030) - Honest Empty State
    // -------------------------------------------------------------------------
    console.log("\n[2] Testing Faculty EMP10026 (Unassigned) - Honest Empty State Display");
    const ctxFaculty2 = await browser.newContext();
    const pageFaculty2 = await ctxFaculty2.newPage();
    await pageFaculty2.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });
    await pageFaculty2.waitForTimeout(1000);

    await pageFaculty2.locator("#facultyEmpId").fill("EMP10026");
    await pageFaculty2.locator("#facultyPassword").fill("pass123");
    await pageFaculty2.getByRole("button", { name: /Access Faculty Dashboard/i }).click();
    await pageFaculty2.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("    Logged in as EMP10026 on Dashboard:", pageFaculty2.url());

    // Wait for "No Assignments Today" card
    await pageFaculty2.waitForSelector("text=No Assignments Today", { timeout: 10000 });
    const emptyStateText = await pageFaculty2.locator("text=You don't have any invigilation duties scheduled for today.").innerText();
    console.log(`    Empty state verified: "${emptyStateText}"`);

    // -------------------------------------------------------------------------
    // TEST 3: Duty Swap Request Workflow
    // -------------------------------------------------------------------------
    console.log("\n[3] Testing Duty Swap Request Workflow (/duty-swap)");
    await pageFaculty1.goto("http://localhost:8080/duty-swap", { waitUntil: "networkidle" });
    await pageFaculty1.waitForSelector("h1", { timeout: 10000 });
    const swapTitle = await pageFaculty1.innerText("h1");
    console.log(`    Page Title: "${swapTitle}"`);

    const initialSwapCount = await pageFaculty1.locator("div.glass.rounded-2xl").count();
    console.log(`    Initial swap requests on page: ${initialSwapCount}`);

    // Click "Request Duty Swap"
    await pageFaculty1.getByRole("button", { name: /Request Duty Swap/i }).click();
    await pageFaculty1.waitForSelector("text=Request Duty Alter", { timeout: 5000 });

    // Fill form
    await pageFaculty1.locator("textarea").fill("Requesting duty swap due to urgent departmental seminar.");
    console.log("    Filled reason in Duty Swap dialog.");

    // -------------------------------------------------------------------------
    // TEST 4: Forms Verification (A-Form, B-Form, Tenancy Form)
    // -------------------------------------------------------------------------
    console.log("\n[4] Testing Institutional Forms as Admin");
    const ctxAdmin = await browser.newContext();
    const pageAdmin = await ctxAdmin.newPage();
    await pageAdmin.goto("http://localhost:8080/auth", { waitUntil: "networkidle" });
    await pageAdmin.getByRole("tab", { name: /Admin Access/i }).click();
    await pageAdmin.locator("#adminId").fill("admin");
    await pageAdmin.locator("#adminPassword").fill("admin123");
    await pageAdmin.getByRole("button", { name: /Enter Exam Cell/i }).click();
    await pageAdmin.waitForURL("**/dashboard", { timeout: 10000 });

    // A-Form
    console.log("    Visiting A-Form: http://localhost:8080/forms/a-form");
    await pageAdmin.goto("http://localhost:8080/forms/a-form", { waitUntil: "networkidle" });
    await pageAdmin.waitForSelector("table tbody tr", { timeout: 10000 });
    const aFormRows = await pageAdmin.locator("table tbody tr").count();
    console.log(`    A-Form Table Rows: ${aFormRows}`);
    if (aFormRows === 0) throw new Error("A-Form has no rows!");

    // B-Form
    console.log("    Visiting B-Form: http://localhost:8080/forms/b-form");
    await pageAdmin.goto("http://localhost:8080/forms/b-form", { waitUntil: "networkidle" });
    await pageAdmin.waitForSelector("table tbody tr", { timeout: 10000 });
    const bFormRows = await pageAdmin.locator("table tbody tr").count();
    console.log(`    B-Form Seating Students Rows: ${bFormRows}`);
    if (bFormRows === 0) throw new Error("B-Form has no student rows!");

    // Tenancy Form
    console.log("    Visiting Tenancy Form: http://localhost:8080/forms/tenancy-form");
    await pageAdmin.goto("http://localhost:8080/forms/tenancy-form", { waitUntil: "networkidle" });
    await pageAdmin.waitForSelector("table tbody tr", { timeout: 10000 });
    const tenancyRows = await pageAdmin.locator("table tbody tr").count();
    console.log(`    Tenancy Form Faculty Rows: ${tenancyRows}`);
    if (tenancyRows === 0) throw new Error("Tenancy Form has no faculty rows!");

    console.log("\n==================================================================");
    console.log("ALL DUTY SCHEDULE, EMPTY STATE, AND FORMS TESTS PASSED CLEANLY!");
    console.log("==================================================================");
  } finally {
    await browser.close();
  }
}

runDutyAndFormsVerification().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
