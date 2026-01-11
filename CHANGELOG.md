# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-01-10 - BREAKING CHANGES

### ⚠️ Breaking Changes from v1.0.0

This is a **complete rewrite** with breaking changes:

**v1.0.0 (Archived)**:
- Quote API
- 4 transport modes (Air, Sea, Road, Rail)
- Rate calculation only
- No booking creation

**v2.0.0 (Current)**:
- Booking API v2
- Road only (DSV XPress)
- Creates real shipments
- Fulfillment handler integration

### Migration Guide

**You cannot upgrade from v1.0.0 to v2.0.0.** This is a new implementation.

If you were using v1.0.0:
1. Review your requirements
2. If you need Air/Sea/Rail, stay on v1.0.0 (archived in `archive/v1.0.0-quote-api` branch)
3. If you need Road/XPress with real bookings, use v2.0.0

### Added in v2.0.0
- DSV Booking API v2 integration
- OAuth 2.0 authentication with automatic token refresh
- Real booking creation with tracking codes
- Fulfillment handler for automatic booking on order fulfillment
- Multi-warehouse support via StockLocation
- Contact extraction from shipping address
- Extensive diagnostic logging
- Explicit null handling for optional address fields
- Package description validation (never empty)
- Support for pickup and delivery instructions
- All fields match DSV working example exactly

### Changed in v2.0.0
- **BREAKING**: Removed Quote API
- **BREAKING**: Removed Air, Sea, Rail transport modes
- **BREAKING**: Now Road-only (DSV XPress)
- Authentication now uses OAuth 2.0 only
- Booking structure updated to 6-party system
- Environment configuration simplified
- autobook: true creates real bookings (not drafts)

### Technical Details v2.0.0
- Proper null vs undefined handling
- Fields: palletSpace, loadingMeters, addressLine3, state, instructions, mdm
- pickupInstructions and deliveryInstructions arrays
- Package descriptions guaranteed non-empty
- Contact data from order.shippingAddress fallback

---

## [1.0.0] - 2025-01-02 - ARCHIVED

**Note**: This version is archived in branch `archive/v1.0.0-quote-api`

### Original Features (v1.0.0)
- OAuth 2.0 authentication
- Quote API integration  
- 4 transport modes (Air, Sea, Road, Rail)
- Rate calculation based on DSV tariffs
- Quote caching (5-minute TTL)
- Label printing
- Document upload/download
- Webhook support

---

## Version Format

We use [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes (1.0.0 → 2.0.0)
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes
