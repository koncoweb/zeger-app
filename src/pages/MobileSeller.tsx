import MobileSellerEnhanced from "@/components/mobile/MobileSellerEnhanced";
import { ZegerLogo } from "@/components/ui/zeger-logo";

export default function MobileSeller() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-white">
      <div className="bg-white/95 backdrop-blur-md">
        <MobileSellerEnhanced />
      </div>
    </div>
  );
}