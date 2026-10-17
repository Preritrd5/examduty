import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  raiseEmergency,
  listEmergencies,
  resolveEmergency,
  getSettings,
  updateSettings,
} from "../src/lib/invigilation.functions.ts";

import {
  listAcademicActivities,
  createAcademicActivity,
  updateAcademicActivity,
  deleteAcademicActivity,
} from "../src/lib/academic-calendar.functions.ts";

import {
  getTimetableWorkspace,
  createOrUpdateTimingSlot,
  deleteTimingSlot,
} from "../src/lib/timetable-management.functions.ts";

import {
  listComputerLabs,
  createComputerLab,
  deleteLabAllocation,
} from "../src/lib/test-management.functions.ts";

async function runPersistenceTests() {
  console.log("==================================================================");
  console.log("STARTING COMPREHENSIVE DATA PERSISTENCE & API VERIFICATION SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------
  // 1. STUDENTS MODULE PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 1: Students Module CRUD & Persistence] ---");
  const testSrn = "2026TEST" + Math.floor(1000 + Math.random() * 9000);
  console.log(`Creating test student: ${testSrn}`);
  const createRes = await createStudent({
    data: {
      register_no: testSrn,
      full_name: "Test Student Persistence",
      department: "Computer Science",
      section: "A",
      semester: 4,
    },
  });
  assert(createRes?.ok === true, "Student creation returned ok: true");

  const studentsAfterCreate = await listStudents();
  const createdStudent = studentsAfterCreate.find((s) => s.register_no === testSrn);
  assert(Boolean(createdStudent), `Persisted student found in listStudents with SRN ${testSrn}`);
  assert(createdStudent?.full_name === "Test Student Persistence", "Student full_name correctly persisted");

  if (createdStudent) {
    console.log("Editing student full_name and section...");
    const updateRes = await updateStudent({
      data: {
        id: createdStudent.id,
        full_name: "Updated Student Verified",
        section: "B",
      },
    });
    assert(updateRes?.ok === true, "Student update returned ok: true");

    const studentsAfterUpdate = await listStudents();
    const updated = studentsAfterUpdate.find((s) => s.id === createdStudent.id);
    assert(updated?.full_name === "Updated Student Verified", "Updated name successfully persisted in database");
    assert(updated?.section === "B", "Updated section successfully persisted in database");

    console.log("Deleting test student...");
    const delRes = await deleteStudent({ data: { id: createdStudent.id } });
    assert(delRes?.ok === true, "Student deletion returned ok: true");

    const studentsAfterDel = await listStudents();
    const deletedFound = studentsAfterDel.find((s) => s.id === createdStudent.id);
    assert(!deletedFound, "Student successfully removed and verified absent from records");
  }

  // ---------------------------------------------------------------
  // 2. ROOMS & HALLS MODULE PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 2: Rooms & Halls Module CRUD & Persistence] ---");
  const testRoomNo = "TEST-R" + Math.floor(100 + Math.random() * 900);
  console.log(`Creating test room: ${testRoomNo}`);
  const createRoomRes = await createRoom({
    data: {
      room_number: testRoomNo,
      floor: 3,
      block: "Block B",
      capacity: 40,
    },
  });
  assert(createRoomRes?.ok === true, "Room creation returned ok: true");

  const roomsAfterCreate = await listRooms();
  const createdRoom = roomsAfterCreate.find((r) => r.room_number === testRoomNo);
  assert(Boolean(createdRoom), `Persisted room found in listRooms with number ${testRoomNo}`);
  assert(createdRoom?.capacity === 40, "Room capacity 40 correctly persisted");

  if (createdRoom) {
    console.log("Updating room capacity to 60...");
    const updateRoomRes = await updateRoom({
      data: {
        id: createdRoom.id,
        capacity: 60,
      },
    });
    assert(updateRoomRes?.ok === true, "Room update returned ok: true");

    const roomsAfterUpdate = await listRooms();
    const updatedR = roomsAfterUpdate.find((r) => r.id === createdRoom.id);
    assert(updatedR?.capacity === 60, "Updated capacity (60) successfully persisted");

    console.log("Deleting test room...");
    const delRoomRes = await deleteRoom({ data: { id: createdRoom.id } });
    assert(delRoomRes?.ok === true, "Room deletion returned ok: true");

    const roomsAfterDel = await listRooms();
    const deletedRFound = roomsAfterDel.find((r) => r.id === createdRoom.id);
    assert(!deletedRFound, "Room successfully removed and verified absent from records");
  }

  // ---------------------------------------------------------------
  // 3. EMERGENCY DESK PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 3: Emergency & Complaint Desk Persistence] ---");
  const emergencyDesc = "Test automated issue " + Date.now();
  console.log(`Raising emergency: ${emergencyDesc}`);
  const raiseRes = await raiseEmergency({
    data: {
      room_number: "A-101",
      description: emergencyDesc,
      urgency: "high",
    },
  });
  assert(raiseRes?.ok === true, "Emergency raise returned ok: true");

  const emergencies = await listEmergencies();
  const raised = emergencies.find((e) => e.description === emergencyDesc);
  assert(Boolean(raised), "Persisted emergency found in listEmergencies");
  assert(raised?.status === "active", "Emergency initial status is active");

  if (raised) {
    console.log("Resolving emergency...");
    const resolveRes = await resolveEmergency({
      data: {
        id: raised.id,
        resolution_notes: "Resolved via automated test suite",
      },
    });
    assert(resolveRes?.ok === true, "Emergency resolution returned ok: true");

    const emergenciesAfterResolve = await listEmergencies();
    const resolved = emergenciesAfterResolve.find((e) => e.id === raised.id);
    assert(resolved?.status === "resolved", "Emergency status updated to 'resolved' in persistence");
    assert(resolved?.resolution_notes === "Resolved via automated test suite", "Resolution notes persisted");
  }

  // ---------------------------------------------------------------
  // 4. ACADEMIC CALENDAR PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 4: Academic Calendar Activities Persistence] ---");
  const activityName = "Automated Milestone " + Date.now();
  console.log(`Creating academic activity: ${activityName}`);
  const createActRes = await createAcademicActivity({
    data: {
      name: activityName,
      activity_type: "academic",
      start_date: "2026-11-01",
      end_date: "2026-11-05",
      timeline_display: "By 05 Nov 2026",
      academic_year: "2026-2027",
      semester: "Odd",
      test_association: "Test-1",
      department: "Computer Science",
      responsible_team: "Test Committee",
      priority: "High",
    },
  });
  assert(createActRes?.ok === true, "Activity creation returned ok: true");

  const activities = await listAcademicActivities();
  const createdAct = activities.find((a) => a.name === activityName);
  assert(Boolean(createdAct), "Persisted academic activity found in listAcademicActivities");

  if (createdAct) {
    console.log("Updating activity status to Completed...");
    const updateActRes = await updateAcademicActivity({
      data: {
        id: createdAct.id,
        status: "Completed",
      },
    });
    assert(updateActRes?.ok === true, "Activity update returned ok: true");

    const activitiesAfterUpdate = await listAcademicActivities();
    const updatedAct = activitiesAfterUpdate.find((a) => a.id === createdAct.id);
    assert(updatedAct?.status === "Completed", "Activity status 'Completed' persisted in database");

    console.log("Deleting academic activity...");
    const delActRes = await deleteAcademicActivity({ data: { id: createdAct.id } });
    assert(delActRes?.ok === true, "Activity deletion returned ok: true");

    const activitiesAfterDel = await listAcademicActivities();
    const deletedActFound = activitiesAfterDel.find((a) => a.id === createdAct.id);
    assert(!deletedActFound, "Academic activity successfully removed from records");
  }

  // ---------------------------------------------------------------
  // 5. TIMETABLE TIMING SLOTS PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 5: Timetable Timing Slots Persistence] ---");
  const slotName = "Slot-Test-" + Date.now();
  console.log(`Creating timing slot: ${slotName}`);
  const createSlotRes = await createOrUpdateTimingSlot({
    data: {
      name: slotName,
      start_time: "07:30",
      end_time: "09:00",
      display_time: "07:30 AM - 09:00 AM",
      session_type: "morning",
      is_active: true,
    },
  });
  assert(createSlotRes?.ok === true, "Timing slot creation returned ok: true");

  const workspace = await getTimetableWorkspace();
  const createdSlot = workspace.timing_slots?.find((s) => s.name === slotName);
  assert(Boolean(createdSlot), "Persisted timing slot found in getTimetableWorkspace");

  if (createdSlot) {
    console.log("Deleting timing slot...");
    const delSlotRes = await deleteTimingSlot({ data: { slot_id: createdSlot.id } });
    assert(delSlotRes?.ok === true, "Timing slot deletion returned ok: true");

    const workspaceAfterDel = await getTimetableWorkspace();
    const deletedSlotFound = workspaceAfterDel.timing_slots?.find((s) => s.id === createdSlot.id);
    assert(!deletedSlotFound, "Timing slot successfully deleted and removed");
  }

  // ---------------------------------------------------------------
  // 6. RULES & SETTINGS PERSISTENCE TEST
  // ---------------------------------------------------------------
  console.log("\n--- [TEST 6: Examination Rules & Settings Persistence] ---");
  const currentSettings = await getSettings();
  assert(Boolean(currentSettings), "getSettings returned active configuration object");

  const originalDutyLimit = currentSettings?.max_duties_per_faculty || 5;
  const testDutyLimit = originalDutyLimit === 7 ? 6 : 7;
  console.log(`Updating max_duties_per_faculty from ${originalDutyLimit} to ${testDutyLimit}...`);
  const updateSettingsRes = await updateSettings({
    data: {
      ...currentSettings,
      max_duties_per_faculty: testDutyLimit,
    },
  });
  assert(updateSettingsRes?.ok === true, "updateSettings returned ok: true");

  const verifySettings = await getSettings();
  assert(verifySettings?.max_duties_per_faculty === testDutyLimit, `Persisted max_duties_per_faculty matches ${testDutyLimit}`);

  // Restore original
  await updateSettings({
    data: {
      ...currentSettings,
      max_duties_per_faculty: originalDutyLimit,
    },
  });
  const restoredSettings = await getSettings();
  assert(restoredSettings?.max_duties_per_faculty === originalDutyLimit, "Restored original settings successfully");

  console.log("\n==================================================================");
  console.log(`PERSISTENCE SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPersistenceTests().catch((err) => {
  console.error("PERSISTENCE SUITE ERROR:", err);
  process.exit(1);
});
