import { StockTransfer as StockTransferComponent } from "@/components/stock/StockTransfer";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function StockTransfer() {
  const { userProfile } = useAuth();

  useEffect(() => {
    document.title = 'Kirim Stok ke Rider | Zeger ERP';
  }, []);

  if (!userProfile) {
    return null;
  }

  return (
    <StockTransferComponent
      role={userProfile.role}
      userId={userProfile.id}
      branchId={userProfile.branch_id}
    />
  );
}
