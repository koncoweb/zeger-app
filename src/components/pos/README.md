# POS Karyawan Branch - Components

This directory contains all reusable components for the POS application.

## Component Categories

### Authentication
- `ProtectedRoute.tsx` - Route protection for kasir roles

### Dashboard
- `StatsCard.tsx` - Sales statistics display cards
- `NavigationMenu.tsx` - Main navigation menu

### Transaction
- `ProductCard.tsx` - Product display card
- `ProductList.tsx` - Product grid with search
- `Cart.tsx` - Shopping cart component
- `CartItem.tsx` - Individual cart item
- `PaymentDialog.tsx` - Payment method selection and processing
- `SplitBillDialog.tsx` - Split bill functionality
- `TransactionSuccess.tsx` - Success confirmation screen

### Receipt
- `ReceiptTemplate.tsx` - Thermal printer receipt template
- `ReceiptPreview.tsx` - Receipt preview before printing

### Inventory
- `InventoryList.tsx` - Inventory table with search
- `StockIndicator.tsx` - Stock level indicator (low/out of stock)

### Attendance
- `AttendanceCard.tsx` - Check-in/check-out card
- `AttendanceHistory.tsx` - Attendance history list

### Transaction History
- `TransactionHistory.tsx` - Transaction list with filters
- `TransactionDetail.tsx` - Detailed transaction view

## Design System

### Colors (Tailwind Classes)
- Primary: `bg-zeger-red` (#DC2626)
- Primary Dark: `bg-zeger-red-dark` (#B91C1C)
- Accent: `bg-zeger-cream` (#FEF3C7)
- Text: `text-zeger-brown` (#92400E)

### Common Patterns
- Loading states: Use `<LoadingSpinner />` from `@/components/ui/loading-spinner`
- Notifications: Use `toast` from `sonner`
- Forms: Use `react-hook-form` with `zod` validation
- Dialogs: Use shadcn/ui `Dialog` component

## Testing

All components should have:
1. Unit tests for rendering and user interactions
2. Property-based tests for business logic using fast-check
3. Test files should be co-located: `ComponentName.test.tsx`
