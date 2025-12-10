import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ModernLayout } from "@/components/layout/ModernLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import POS from "./pages/POS";
import MobileSeller from "./pages/MobileSeller";
import CustomerApp from "./pages/CustomerApp";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import OrdersManagement from "./pages/OrdersManagement";
import ProfitLoss from "./pages/finance/ProfitLoss";
import CashFlow from "./pages/finance/CashFlow";
import BalanceSheet from "./pages/finance/BalanceSheet";
import OperationalExpenses from "./pages/finance/OperationalExpenses";
import RiderExpenses from "./pages/finance/RiderExpenses";
import { TransactionDetails } from "./pages/TransactionDetails";
import { TransactionsEnhanced } from "./pages/TransactionsEnhanced";
import Branches from "./pages/Branches";
import Riders from "./pages/Riders";
import Inventory from "./pages/Inventory";
import AdminUsers from "./pages/AdminUsers";
import StockTransfer from "./pages/StockTransfer";
import CustomerManager from "./pages/CustomerManager";
import RiderPerformance from "./pages/RiderPerformance";
import InventoryProductionPage from "./pages/inventory/ProductionPage";
import { default as InventoryBranchTransfer } from "./pages/inventory/BranchTransfer";
import PurchasingSimple from "./pages/inventory/PurchasingSimple";
import { SmallBranchStockManagement } from "./components/inventory/SmallBranchStockManagement";
import { LocationAnalytics } from "./pages/analytics/LocationAnalytics";
import CentralKitchenAnalytics from "./pages/analytics/CentralKitchen";
import CashDeposit from "./pages/analytics/CashDeposit";
import WasteManagementPage from "./pages/inventory/WasteManagementPage";
import StockCardRider from "./pages/inventory/StockCardRider";
import SettingsUserManagement from "./pages/settings/UserManagement";
import SettingsRiderManagement from "./pages/settings/RiderManagement";
import BranchManagement from "./pages/settings/BranchManagement";
import RiderReassignment from "./pages/settings/RiderReassignment";
import FixZeroTransactions from "./pages/settings/FixZeroTransactions";
import AppManagement from "./pages/settings/AppManagement";
import PromoBannerManagement from "./pages/settings/PromoBannerManagement";
import LoyaltyManagement from "./pages/settings/LoyaltyManagement";
import CRMManagement from "./pages/settings/CRMManagement";
import { BranchHubReportLayout } from "./components/layout/BranchHubReportLayout";
import { BranchHubReportDashboard } from "./components/dashboard/BranchHubReportDashboard";
import CreateMalangBranch from "./pages/CreateMalangBranch";
import { POSAuth } from "./pages/pos/POSAuth";
import { POSDashboard } from "./pages/pos/POSDashboard";
import { POSTransaction } from "./pages/pos/POSTransaction";
import { POSHistory } from "./pages/pos/POSHistory";
import POSInventory from "./pages/pos/POSInventory";
import POSAttendance from "./pages/pos/POSAttendance";
import { POSAuthProvider } from "./hooks/usePOSAuth";
import { POSProtectedRoute } from "./components/pos/POSProtectedRoute";
import { ErrorBoundary } from "./components/pos/ErrorBoundary";



const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/pos-app/auth" element={
              <POSAuthProvider>
                <POSAuth />
              </POSAuthProvider>
            } />
            <Route path="/" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <div className="space-y-6">
                    <header>
                      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                      <p className="text-gray-600">Selamat datang di Zeger Management System</p>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Penjualan Hari Ini</h3>
                        <p className="text-2xl font-bold text-green-600">Rp 2,450,000</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Total Transaksi</h3>
                        <p className="text-2xl font-bold text-blue-600">156</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Produk Terjual</h3>
                        <p className="text-2xl font-bold text-purple-600">324</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-900">Customer Aktif</h3>
                        <p className="text-2xl font-bold text-orange-600">89</p>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        <strong>Info:</strong> Dashboard lengkap sedang dalam perbaikan. 
                        Silakan gunakan menu navigasi untuk mengakses fitur lainnya.
                      </p>
                    </div>
                  </div>
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/mobile-seller" element={
              <RoleBasedRoute allowedRoles={['rider', 'sb_rider', 'bh_rider']}>
                <MobileSeller />
              </RoleBasedRoute>
            } />
            <Route path="/customer-app" element={
              <RoleBasedRoute allowedRoles={['customer']} redirectTo="/auth">
                <CustomerApp />
              </RoleBasedRoute>
            } />
            <Route path="/customer" element={<CustomerApp />} />
            <Route path="/admin" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <AdminDashboard />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/analytics/central-kitchen" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager']}>
                <ModernLayout>
                  <CentralKitchenAnalytics />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/analytics/cash-deposit" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <CashDeposit />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            {/* Legacy POS Route - kept for backward compatibility */}
            <Route path="/pos" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <Layout>
                  <POS />
                </Layout>
              </RoleBasedRoute>
            } />
            
            {/* New POS App Routes for Kasir */}
            <Route path="/pos-app" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSDashboard />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/pos-app/dashboard" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSDashboard />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/pos-app/transaction" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSTransaction />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/pos-app/history" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSHistory />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/pos-app/inventory" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSInventory />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/pos-app/attendance" element={
              <POSAuthProvider>
                <ErrorBoundary>
                  <POSProtectedRoute>
                    <POSAttendance />
                  </POSProtectedRoute>
                </ErrorBoundary>
              </POSAuthProvider>
            } />
            <Route path="/branches" element={
              <RoleBasedRoute allowedRoles={['ho_admin']}>
                <ModernLayout>
                  <Branches />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/riders" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <Riders />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/customers" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'rider', 'sb_rider', 'bh_rider']}>
                <ModernLayout>
                  <CustomerManager />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/orders-management" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <OrdersManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/rider-performance" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <RiderPerformance />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/location-analytics" element={
                <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'bh_report']}>
                  <ModernLayout>
                    <LocationAnalytics />
                  </ModernLayout>
                </RoleBasedRoute>
              } />
            <Route path="/finance" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <ProfitLoss />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/finance/profit-loss" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <ProfitLoss />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/finance/cash-flow" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <CashFlow />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/finance/balance-sheet" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <BalanceSheet />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/finance/operational-expenses" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <OperationalExpenses />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/finance/rider-expenses" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <RiderExpenses />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/transaction-details" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <TransactionDetails />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/transactions" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', 'finance']}>
                <ModernLayout>
                  <TransactionsEnhanced />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/inventory" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <Inventory />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/sales" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <TransactionsEnhanced />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/admin-users" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <AdminUsers />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/reports" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <TransactionsEnhanced />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <SettingsUserManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/users" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <SettingsUserManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/riders" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <SettingsRiderManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/branches" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager']}>
                <ModernLayout>
                  <BranchManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/rider-reassignment" element={
              <RoleBasedRoute allowedRoles={['ho_admin']}>
                <ModernLayout>
                  <RiderReassignment />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/app-management" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager']}>
                <ModernLayout>
                  <AppManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/app-management/promo-banners" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager']}>
                <ModernLayout>
                  <PromoBannerManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/app-management/loyalty" element={
              <RoleBasedRoute allowedRoles={['ho_admin', '1_HO_Admin', '1_HO_Owner']}>
                <ModernLayout>
                  <LoyaltyManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/app-management/crm" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager']}>
                <ModernLayout>
                  <CRMManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/app-management/vouchers" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager']}>
                <ModernLayout>
                  <AppManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/settings/fix-transactions" element={
              <RoleBasedRoute allowedRoles={['ho_admin']}>
                <ModernLayout>
                  <FixZeroTransactions />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/help" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager']}>
                <ModernLayout>
                  <AdminUsers />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/stock-transfer" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <StockTransfer />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/inventory/production" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager']}>
                <ModernLayout>
                  <InventoryProductionPage />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/inventory/branch-transfer" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager']}>
                <ModernLayout>
                  <InventoryBranchTransfer />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/inventory/waste-management" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager', '3_SB_Branch_Manager']}>
                <ModernLayout>
                  <WasteManagementPage />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/inventory/stock-card-rider" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager', '1_HO_Admin', '1_HO_Owner', '2_Hub_Branch_Manager', '3_SB_Branch_Manager']}>
                <ModernLayout>
                  <StockCardRider />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            
            {/* Small Branch Specific Routes */}
            <Route path="/inventory/purchasing" element={
              <RoleBasedRoute allowedRoles={['sb_branch_manager']}>
                <ModernLayout>
                  <PurchasingSimple />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            
            <Route path="/inventory/small-branch-stock" element={
              <RoleBasedRoute allowedRoles={['sb_branch_manager']}>
                <ModernLayout>
                  <SmallBranchStockManagement />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/reports/sales" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <TransactionsEnhanced />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/reports/inventory" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <Inventory />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/reports/financial" element={
              <RoleBasedRoute allowedRoles={['ho_admin', 'branch_manager', 'sb_branch_manager']}>
                <ModernLayout>
                  <ProfitLoss />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/admin/users" element={
              <RoleBasedRoute allowedRoles={['ho_admin']}>
                <ModernLayout>
                  <AdminUsers />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            <Route path="/admin/create-malang-branch" element={
              <RoleBasedRoute allowedRoles={['ho_admin']}>
                <ModernLayout>
                  <CreateMalangBranch />
                </ModernLayout>
              </RoleBasedRoute>
            } />
            
            {/* Branch Hub Report Routes */}
            <Route path="/bh-report-dashboard" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <BranchHubReportDashboard />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-transactions" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <TransactionsEnhanced />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-transaction-details" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <TransactionDetails />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-rider-performance" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <RiderPerformance />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-waste-management" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <WasteManagementPage />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-profit-loss" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <ProfitLoss />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            <Route path="/bh-report-cash-flow" element={
              <RoleBasedRoute allowedRoles={['bh_report']}>
                <BranchHubReportLayout>
                  <CashFlow />
                </BranchHubReportLayout>
              </RoleBasedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
);

export default App;
