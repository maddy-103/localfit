import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { RootLayout } from '@/components/RootLayout';
import { AuthLayout } from '@/components/AuthLayout';
import { ConsoleLayout } from '@/components/ConsoleLayout';
import { RoleGuard } from '@/components/RoleGuard';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './router.module.css';

const WelcomePage = lazy(() => import('./auth/WelcomePage'));
const LoginPage = lazy(() => import('./auth/LoginPage'));
const OtpPage = lazy(() => import('./auth/OtpPage'));
const OnboardingProfilePage = lazy(() => import('./auth/OnboardingProfilePage'));
const ConsentPage = lazy(() => import('./auth/ConsentPage'));
const RegisterShopPage = lazy(() => import('./auth/RegisterShopPage'));
const RegisterRiderPage = lazy(() => import('./auth/RegisterRiderPage'));
const AccessDeniedPage = lazy(() => import('./auth/AccessDeniedPage'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

const HomePage = lazy(() => import('./buyer/HomePage'));
const OccasionPage = lazy(() => import('./buyer/OccasionPage'));
const SearchPage = lazy(() => import('./buyer/SearchPage'));
const ProductPage = lazy(() => import('./buyer/ProductPage'));
const ShopProfilePage = lazy(() => import('./buyer/ShopProfilePage'));
const BagPage = lazy(() => import('./buyer/BagPage'));
const CheckoutPage = lazy(() => import('./buyer/CheckoutPage'));
const OrdersPage = lazy(() => import('./buyer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./buyer/OrderDetailPage'));
const OrderConfirmedPage = lazy(() => import('./buyer/OrderConfirmedPage'));
const OrderTrackPage = lazy(() => import('./buyer/OrderTrackPage'));
const OrderTrialPage = lazy(() => import('./buyer/OrderTrialPage'));
const OrderReturnPage = lazy(() => import('./buyer/OrderReturnPage'));
const WishlistPage = lazy(() => import('./buyer/WishlistPage'));
const SupportPage = lazy(() => import('./buyer/SupportPage'));
const ProfilePage = lazy(() => import('./buyer/ProfilePage'));
const AddressesPage = lazy(() => import('./buyer/AddressesPage'));
const PaymentMethodsPage = lazy(() => import('./buyer/PaymentMethodsPage'));
const LanguageSettingsPage = lazy(() => import('./buyer/LanguageSettingsPage'));
const PrivacyPage = lazy(() => import('./buyer/PrivacyPage'));
const ProfileRolesPage = lazy(() => import('./buyer/ProfileRolesPage'));

const ShopDashboardPage = lazy(() => import('./shop/DashboardPage'));
const ShopOrdersPage = lazy(() => import('./shop/OrdersPage'));
const ShopOrderDetailPage = lazy(() => import('./shop/OrderDetailPage'));
const ShopListingNewPage = lazy(() => import('./shop/ListingNewPage'));
const ShopInventoryPage = lazy(() => import('./shop/InventoryPage'));
const ShopReturnsPage = lazy(() => import('./shop/ReturnsPage'));
const ShopPayoutsPage = lazy(() => import('./shop/PayoutsPage'));
const ShopSettingsPage = lazy(() => import('./shop/SettingsPage'));
const ShopSupportPage = lazy(() => import('./shop/SupportPage'));

const RiderDashboardPage = lazy(() => import('./rider/DashboardPage'));
const RiderTasksPage = lazy(() => import('./rider/TasksPage'));
const RiderTaskPage = lazy(() => import('./rider/TaskPage'));
const RiderEarningsPage = lazy(() => import('./rider/EarningsPage'));
const RiderSafetyPage = lazy(() => import('./rider/SafetyPage'));
const RiderProfilePage = lazy(() => import('./rider/ProfilePage'));
const RiderSupportPage = lazy(() => import('./rider/SupportPage'));

const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./admin/DashboardPage'));
const AdminShopsPage = lazy(() => import('./admin/ShopsPage'));
const AdminOrdersPage = lazy(() => import('./admin/OrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./admin/OrderDetailPage'));
const AdminDisputesPage = lazy(() => import('./admin/DisputesPage'));
const AdminRefundsPage = lazy(() => import('./admin/RefundsPage'));
const AdminPayoutsPage = lazy(() => import('./admin/PayoutsPage'));
const AdminRidersPage = lazy(() => import('./admin/RidersPage'));
const AdminRiskPage = lazy(() => import('./admin/RiskPage'));
const AdminCampaignsPage = lazy(() => import('./admin/CampaignsPage'));
const AdminConfigPage = lazy(() => import('./admin/ConfigPage'));
const AdminStaffPage = lazy(() => import('./admin/StaffPage'));
const AdminAuditPage = lazy(() => import('./admin/AuditPage'));

const StylePage = import.meta.env.DEV ? lazy(() => import('./_style/StylePage')) : null;

// eslint-disable-next-line react-refresh/only-export-components
function RouteFallback() {
  const { t } = useI18n();
  return (
    <div className={styles.fallback} aria-busy="true" aria-label={t('common.loading')}>
      <Skeleton variant="line" width="40%" height={36} />
      <Skeleton variant="card" count={2} />
    </div>
  );
}

function page(node: ReactNode): ReactNode {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

function adminPage(permission: string, node: ReactNode): ReactNode {
  return <RoleGuard adminPermission={permission}>{page(node)}</RoleGuard>;
}

function signedIn(node: ReactNode): ReactNode {
  return <RoleGuard requiresAuth>{page(node)}</RoleGuard>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: page(<HomePage />) },
      { path: 'occasion/:slug', element: page(<OccasionPage />) },
      { path: 'search', element: page(<SearchPage />) },
      { path: 'product/:id', element: page(<ProductPage />) },
      { path: 'shop/:id', element: page(<ShopProfilePage />) },
      { path: 'bag', element: page(<BagPage />) },
      { path: 'checkout', element: signedIn(<CheckoutPage />) },
      { path: 'orders', element: signedIn(<OrdersPage />) },
      { path: 'orders/:id', element: signedIn(<OrderDetailPage />) },
      { path: 'order/:id/confirmed', element: signedIn(<OrderConfirmedPage />) },
      { path: 'order/:id/track', element: signedIn(<OrderTrackPage />) },
      { path: 'order/:id/trial', element: signedIn(<OrderTrialPage />) },
      { path: 'order/:id/return', element: signedIn(<OrderReturnPage />) },
      // Canonical links use /orders/:id; the older singular paths stay as aliases.
      { path: 'orders/:id/confirmed', element: signedIn(<OrderConfirmedPage />) },
      { path: 'orders/:id/track', element: signedIn(<OrderTrackPage />) },
      { path: 'orders/:id/trial', element: signedIn(<OrderTrialPage />) },
      { path: 'orders/:id/return', element: signedIn(<OrderReturnPage />) },
      { path: 'wishlist', element: signedIn(<WishlistPage />) },
      { path: 'support', element: page(<SupportPage />) },
      { path: 'profile', element: signedIn(<ProfilePage />) },
      { path: 'profile/addresses', element: signedIn(<AddressesPage />) },
      { path: 'profile/payments', element: signedIn(<PaymentMethodsPage />) },
      { path: 'profile/language', element: signedIn(<LanguageSettingsPage />) },
      { path: 'profile/privacy', element: signedIn(<PrivacyPage />) },
      { path: 'profile/roles', element: signedIn(<ProfileRolesPage />) },
      {
        element: <AuthLayout />,
        children: [
          { path: 'welcome', element: page(<WelcomePage />) },
          { path: 'login', element: page(<LoginPage />) },
          { path: 'login/otp', element: page(<OtpPage />) },
          { path: 'onboarding/profile', element: page(<OnboardingProfilePage />) },
          { path: 'consent', element: page(<ConsentPage />) },
          { path: 'register/shop', element: page(<RegisterShopPage />) },
          { path: 'register/rider', element: page(<RegisterRiderPage />) },
          { path: 'admin/login', element: page(<AdminLoginPage />) },
          { path: 'forbidden', element: page(<AccessDeniedPage />) },
        ],
      },
      {
        path: 'shop',
        element: (
          <RoleGuard requiredRole="shop">
            <ConsoleLayout role="shop" />
          </RoleGuard>
        ),
        children: [
          { index: true, element: page(<ShopDashboardPage />) },
          { path: 'orders', element: page(<ShopOrdersPage />) },
          { path: 'orders/:id', element: page(<ShopOrderDetailPage />) },
          { path: 'listing/new', element: page(<ShopListingNewPage />) },
          { path: 'inventory', element: page(<ShopInventoryPage />) },
          { path: 'returns', element: page(<ShopReturnsPage />) },
          { path: 'payouts', element: page(<ShopPayoutsPage />) },
          { path: 'settings', element: page(<ShopSettingsPage />) },
          { path: 'support', element: page(<ShopSupportPage />) },
        ],
      },
      {
        path: 'rider',
        element: (
          <RoleGuard requiredRole="rider">
            <ConsoleLayout role="rider" />
          </RoleGuard>
        ),
        children: [
          { index: true, element: page(<RiderDashboardPage />) },
          { path: 'tasks', element: page(<RiderTasksPage />) },
          { path: 'tasks/:id', element: page(<RiderTaskPage />) },
          { path: 'earnings', element: page(<RiderEarningsPage />) },
          { path: 'safety', element: page(<RiderSafetyPage />) },
          { path: 'profile', element: page(<RiderProfilePage />) },
          { path: 'support', element: page(<RiderSupportPage />) },
        ],
      },
      {
        path: 'admin',
        element: (
          <RoleGuard requiredRole={['admin', 'super_admin']}>
            <ConsoleLayout role="admin" />
          </RoleGuard>
        ),
        children: [
          { index: true, element: adminPage('read:orders', <AdminDashboardPage />) },
          { path: 'shops', element: adminPage('read:shops', <AdminShopsPage />) },
          { path: 'orders', element: adminPage('read:orders', <AdminOrdersPage />) },
          { path: 'orders/:id', element: adminPage('read:orders', <AdminOrderDetailPage />) },
          { path: 'disputes', element: adminPage('read:disputes', <AdminDisputesPage />) },
          { path: 'refunds', element: adminPage('read:refunds', <AdminRefundsPage />) },
          { path: 'payouts', element: adminPage('read:payouts', <AdminPayoutsPage />) },
          { path: 'riders', element: adminPage('read:riders', <AdminRidersPage />) },
          { path: 'risk', element: adminPage('read:buyers', <AdminRiskPage />) },
          { path: 'campaigns', element: adminPage('read:orders', <AdminCampaignsPage />) },
          { path: 'config', element: adminPage('*', <AdminConfigPage />) },
          { path: 'staff', element: adminPage('*', <AdminStaffPage />) },
          { path: 'audit', element: adminPage('read:orders', <AdminAuditPage />) },
        ],
      },
      ...(import.meta.env.DEV && StylePage
        ? [{ path: '_style', element: page(<StylePage />) }]
        : []),
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
