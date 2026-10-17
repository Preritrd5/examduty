import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/timetable")({
  beforeLoad: () => {
    throw redirect({ to: "/timetable-allocation" });
  },
});
