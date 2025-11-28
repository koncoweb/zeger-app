# POS Karyawan Branch - Pages

This directory contains all page components for the POS (Point of Sale) application for Zeger branch employees (kasir).

## Structure

- `POSAuth.tsx` - Login page for kasir authentication
- `POSDashboard.tsx` - Main dashboard with sales summary and navigation
- `POSTransaction.tsx` - Transaction page with product list and cart
- `POSHistory.tsx` - Transaction history and detail view
- `POSInventory.tsx` - Inventory management and stock view
- `POSAttendance.tsx` - Attendance check-in/check-out page

## Routes

All POS pages are accessible under `/pos-app/*` routes and require kasir role authentication:
- Allowed roles: `bh_kasir`, `sb_kasir`, `2_Hub_Kasir`, `3_SB_Kasir`

## Design Guidelines

- Use Zeger red color scheme (#DC2626) as primary color
- Modern, sleek UI with Tailwind CSS
- Mobile-first responsive design
- Clear visual feedback for all interactions
- Indonesian language for all UI text
