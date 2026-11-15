import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import NewPieceForm from "@/components/editor/NewPieceForm";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewPiecePage() {
  const viewer = await getViewer();
  if (!viewer) return <AdminSignIn />;
  if (!viewer.isAdmin) notFound();
  return <NewPieceForm />;
}
