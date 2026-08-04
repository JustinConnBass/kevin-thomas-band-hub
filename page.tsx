import type { Metadata } from "next";
import { CalendarManager } from "@/components/calendar-manager";
import { PageHeader } from "@/components/page-header";
import { isUserRole } from "@/lib/auth/permissions";
import { getCalendarPageData } from "@/lib/calendar/server";

export const metadata: Metadata = { title: "Gig calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ demoRole?: string }> }) {
  const params = await searchParams;
  const data = await getCalendarPageData();
  const role = data.dataSource === "demo" && isUserRole(params.demoRole) ? params.demoRole : data.role;
  return (
    <>
      <PageHeader title="Gig calendar" subtitle="Call times, locations, itinerary details, and the shared source of truth for every show." />
      <CalendarManager initialGigs={data.gigs} role={role} dataSource={data.dataSource} />
    </>
  );
}
