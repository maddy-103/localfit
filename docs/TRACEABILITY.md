ID | Where | Test file
---|---|---
AUTH-01 | src/routes/auth/LoginPage.tsx, src/routes/auth/OtpPage.tsx | src/routes/auth/__tests__/AUTH-01.test.tsx
AUTH-02 | src/routes/auth/WelcomePage.tsx, src/routes/buyer/HomePage.tsx | src/routes/router.test.tsx
AUTH-03 | src/routes/auth/ConsentPage.tsx | src/routes/auth/__tests__/AUTH-03.test.tsx
AUTH-04 | src/routes/auth/RegisterShopPage.tsx, src/routes/auth/RegisterShopStatusPage.tsx, src/components/shop/ShopRegistrationForm.tsx | src/routes/router.test.tsx (route coverage)
AUTH-05 | src/routes/auth/RegisterRiderPage.tsx | (pending)
AUTH-06 | src/routes/admin/AdminLoginPage.tsx | (pending)
AUTH-07 | src/routes/buyer/ProfileRolesPage.tsx | src/routes/buyer/__tests__/AUTH-07.test.tsx
BUY-01 | src/routes/buyer/HomePage.tsx, src/components/buyer/OccasionHub.tsx | src/routes/buyer/__tests__/BUY-15.test.tsx
BUY-02 | src/routes/buyer/SearchPage.tsx, src/components/buyer/SearchFilters.tsx | src/routes/router.test.tsx
BUY-03 | src/routes/buyer/ProductPage.tsx, src/components/buyer/ProductGallery.tsx | src/routes/buyer/__tests__/BUY-04.test.tsx
BUY-04 | src/routes/buyer/ProductPage.tsx | src/routes/buyer/__tests__/BUY-04.test.tsx
BUY-05 | src/routes/buyer/ProductPage.tsx, src/components/buyer/SizeGuideSheet.tsx | (pending)
BUY-06 | src/routes/buyer/ProductPage.tsx, src/components/buyer/TryTermsSheet.tsx | (pending)
BUY-07 | src/routes/buyer/BagPage.tsx, src/components/buyer/EtaCountdown.tsx | (pending)
BUY-08 | src/routes/buyer/CheckoutPage.tsx, src/components/buyer/TrialTermsBlock.tsx | src/routes/buyer/__tests__/BUY-08.test.tsx
BUY-09 | src/routes/buyer/OrderTrackPage.tsx, src/components/buyer/OrderTimeline.tsx | src/api/__tests__/SPEC-13.test.ts, src/api/__tests__/fullDemoPath.test.ts
BUY-10 | src/routes/buyer/OrderTrialPage.tsx, src/api/mockTrial.ts | src/api/__tests__/TRIAL-02.test.ts, src/api/__tests__/TRIAL-03.test.ts, src/api/__tests__/sizeSwap.test.ts
BUY-11 | src/routes/buyer/OrderReturnPage.tsx | src/api/__tests__/fullDemoPath.test.ts
BUY-12 | src/routes/buyer/WishlistPage.tsx (saved items and sizes; alerts are phase 2 placeholders) | src/routes/router.test.tsx
BUY-13 | src/routes/buyer/ProductPage.tsx (phase 2 placeholder) | —
BUY-14 | src/routes/buyer/SupportPage.tsx, src/routes/buyer/OrderDetailPage.tsx | src/routes/router.test.tsx
BUY-15 | src/lib/homeCache.ts, src/routes/buyer/HomePage.tsx | src/routes/buyer/__tests__/BUY-15.test.tsx
BUY-16 | src/components/RoleGuard.tsx, src/routes/buyer/ProductPage.tsx, src/routes/buyer/CheckoutPage.tsx | src/routes/buyer/__tests__/BUY-16.test.tsx
BUY-17 | src/routes/buyer/PrivacyPage.tsx | src/routes/buyer/__tests__/BUY-17.test.tsx
SHOP-01 | src/routes/shop/ListingNewPage.tsx, src/components/shop/ListingForm.tsx, src/domain/shop.ts, scripts/measure-listing-steps.ts | src/routes/shop/__tests__/SHOP-01.test.tsx, src/routes/shop/__tests__/SHOP-01-steps.test.tsx
SHOP-02 | src/routes/shop/ListingNewPage.tsx, src/api/mockShopSetup.ts (IndexedDB drafts and reconnect sync) | src/routes/shop/__tests__/SHOP-01.test.tsx
SHOP-03 | src/routes/shop/InventoryPage.tsx, src/components/shop/InventoryVariantRow.tsx, src/routes/buyer/ProductPage.tsx | src/routes/shop/__tests__/SHOP-03.test.tsx
SHOP-04 | src/routes/shop/InventoryPage.tsx, src/domain/stock.ts, src/api/mockShopOps.ts | src/api/__tests__/SHOP-04-07.test.ts
SHOP-05 | src/routes/shop/InventoryPage.tsx, src/routes/shop/SettingsPage.tsx, src/api/mockShopOps.ts | src/routes/router.test.tsx
SHOP-06 | src/routes/shop/DashboardPage.tsx, src/routes/shop/OrdersPage.tsx, src/domain/sla.ts, src/api/mockShopReports.ts | src/api/__tests__/SHOP-04-07.test.ts
SHOP-07 | src/routes/shop/OrderDetailPage.tsx, src/api/mockShopOps.ts | src/api/__tests__/SHOP-04-07.test.ts
SHOP-08 | src/routes/shop/PayoutsPage.tsx, src/domain/settlements.ts, src/api/mockShopReports.ts | src/routes/router.test.tsx
SHOP-09 | src/routes/shop/ReturnsPage.tsx, src/api/mockShopReports.ts | src/routes/router.test.tsx
SHOP-10 | src/routes/shop/*, src/components/shop/*, src/styles/tokens.css | src/routes/shop/__tests__/SHOP-01.test.tsx, src/i18n/NFR-07.test.ts
SHOP-11 | src/routes/shop/DashboardPage.tsx (Phase2Card, "Coming in phase 2") | —
SHOP-12 | src/routes/shop/PayoutsPage.tsx (Phase2Card, "Coming in phase 2") | —
SHOP-13 | (phase 2 placeholder) | —
RIDE-01 | src/routes/rider/RiderDashboard.tsx | (pending)
RIDE-02 | src/routes/rider/RiderTaskPage.tsx | (pending)
RIDE-03 | src/routes/rider/RiderTaskPage.tsx | (pending)
RIDE-04 | src/routes/rider/RiderTaskPage.tsx, src/routes/buyer/OrderTrackPage.tsx | src/api/__tests__/fullDemoPath.test.ts
RIDE-05 | src/routes/rider/RiderTaskPage.tsx | (pending)
RIDE-06 | src/routes/rider/RiderEarningsPage.tsx | (pending)
RIDE-07 | src/routes/rider/RiderSafetyPage.tsx | (pending)
RIDE-08 | src/routes/rider/RiderDashboard.tsx | (pending)
RIDE-09 | src/routes/rider/RiderTaskPage.tsx | (pending)
ADM-01 | src/routes/admin/AdminDashboard.tsx | (pending)
ADM-02 | src/routes/admin/AdminShopsPage.tsx | (pending)
ADM-03 | src/routes/admin/AdminDisputesPage.tsx | (pending)
ADM-04 | src/routes/admin/AdminRefundsPage.tsx, src/routes/admin/AdminPayoutsPage.tsx | (pending)
ADM-05 | src/routes/admin/AdminOrdersPage.tsx | (pending)
ADM-06 | src/routes/admin/AdminRidersPage.tsx | (pending)
ADM-07 | src/routes/admin/AdminRiskPage.tsx | (pending)
ADM-08 | src/routes/admin/AdminConfigPage.tsx | (pending)
ADM-09 | src/components/RoleGuard.tsx, src/domain/permissions.ts | (pending)
ADM-10 | src/routes/admin/AdminCampaignsPage.tsx (phase 2 placeholder) | —
TRIAL-01 | src/domain/trial.ts, src/routes/buyer/OrderTrialPage.tsx | src/domain/trial.test.ts, src/api/__tests__/TRIAL-02.test.ts
TRIAL-02 | src/routes/buyer/OrderTrialPage.tsx, src/components/buyer/EtaCountdown.tsx | src/api/__tests__/TRIAL-02.test.ts
TRIAL-03 | src/api/mockTrial.ts, src/routes/buyer/OrderTrialPage.tsx | src/api/__tests__/TRIAL-03.test.ts, src/api/__tests__/sizeSwap.test.ts
SPEC-13 | src/api/mockFlow.ts, src/api/mockTrial.ts, src/domain/orderMachine.ts | src/api/__tests__/SPEC-13.test.ts
AMBIGUITY-9 | src/api/mockFlow.ts, src/api/types.ts | src/api/__tests__/checkoutSplit.test.ts
AMBIGUITY-10 | src/domain/payments.ts, src/routes/buyer/CheckoutPage.tsx | (pending)
AMBIGUITY-11 | src/domain/stock.ts, src/api/mockShopOps.ts | src/api/__tests__/SHOP-04-07.test.ts
NFR-03 | src/api/mockStore.ts (BroadcastChannel inventory), src/routes/buyer/HomePage.tsx, src/routes/buyer/ProductPage.tsx, src/routes/buyer/SearchPage.tsx | src/routes/shop/__tests__/SHOP-03.test.tsx
NFR-04 | src/api/mockShopSetup.ts (IndexedDB drafts), src/routes/shop/ListingNewPage.tsx | src/routes/shop/__tests__/SHOP-01.test.tsx
NFR-05 | src/styles/tokens.css, src/routes/shop/shop.module.css | src/routes/shop/__tests__/SHOP-01.test.tsx
NFR-06 | src/components/ui/StatusChip.tsx | (pending)
NFR-07 | src/i18n/en.ts, src/i18n/hi.ts | src/i18n/NFR-07.test.ts
NFR-08 | src/routes/auth/ConsentPage.tsx, src/routes/buyer/PrivacyPage.tsx | src/routes/buyer/__tests__/NFR-08.test.tsx
NFR-11 | src/routes/buyer/PaymentMethodsPage.tsx, src/api/mock.ts | src/routes/buyer/__tests__/NFR-11.test.tsx
NFR-14 | src/routes/buyer/SupportPage.tsx, src/routes/buyer/OrderDetailPage.tsx | src/routes/router.test.tsx
