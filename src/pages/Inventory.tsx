import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryStatus } from "@/components/inventory/InventoryStatus";

export default function Inventory() {
  useEffect(() => {
    document.title = 'Inventori | Zeger ERP';
  }, []);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Inventori</h1>
        <p className="text-sm text-muted-foreground">Pantau stok per cabang / rider.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Status Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryStatus role="ho" />
        </CardContent>
      </Card>
    </main>
  );
}
