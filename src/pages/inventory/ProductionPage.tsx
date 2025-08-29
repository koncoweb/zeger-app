import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Production } from "@/components/inventory/Production";

export default function InventoryProductionPage() {
  const { userProfile } = useAuth();

  useEffect(() => {
    document.title = "Production | Zeger ERP";
  }, []);

  if (!userProfile) return null;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Production</h1>
        <p className="text-sm text-muted-foreground">Kelola produksi harian cabang.</p>
      </header>
      <Production userProfile={userProfile} />
    </main>
  );
}
