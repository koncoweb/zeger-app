# Integration Tests

This directory contains integration tests for the POS application. These tests verify end-to-end flows across multiple components and hooks.

## Test Files

### transaction-flow.integration.test.tsx
Tests the complete transaction flow from adding items to cart through payment and database storage.

**Covered Flows:**
- Add to cart → checkout → payment → database records
- Multiple items in cart
- Discount handling
- Quantity updates
- Item removal

### auth-flow.integration.test.tsx
Tests the authentication flow from login through role verification.

**Covered Flows:**
- Login → role check → session management → logout
- Kasir role verification
- Non-kasir role rejection
- Authentication errors
- Multiple kasir role types

### inventory-updates.integration.test.tsx
Tests inventory management with concurrent operations.

**Covered Flows:**
- Inventory loading by branch
- Stock quantity retrieval
- Low stock identification
- Out of stock prevention
- Concurrent stock updates
- Stock validation (never negative)

### attendance-flow.integration.test.tsx
Tests attendance system with geolocation.

**Covered Flows:**
- Check-in with geolocation capture
- Check-out with location update
- Geolocation permission handling
- Duplicate check-in prevention
- Check-out without check-in prevention
- Location coordinate validation

## Running Integration Tests

```bash
npm test -- src/integration/
```

## Notes

These integration tests require proper React context providers (POSAuthProvider) to function correctly. In a production environment, these would be wrapped with the necessary providers or use a test harness that provides the required context.

The tests demonstrate the expected behavior and flow of the application, serving as documentation of the integration points between components.

## Future Improvements

- Add proper test providers/wrappers
- Implement test database fixtures
- Add E2E tests with Playwright or Cypress for full browser testing
- Add performance benchmarks for critical flows
