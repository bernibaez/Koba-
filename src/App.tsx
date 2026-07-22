import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/point-of-sale-pos/POSPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import ProductManagementPage from './pages/product-management/ProductManagementPage';
import StockTransfersPage from './pages/StockTransfersPage';
import StockAdjustmentsPage from './pages/StockAdjustmentsPage';
import ContactsPage from './pages/ContactsPage';
import ExpensesPage from './pages/ExpensesPage';
import AccountsReceivablePage from './pages/AccountsReceivablePage';
import AccountsPayablePage from './pages/AccountsPayablePage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/point-of-sale-pos" element={<POSPage />} />
      <Route path="/sales" element={<SalesPage />} />
      <Route path="/purchases" element={<PurchasesPage />} />
      <Route path="/product-management" element={<ProductManagementPage />} />
      <Route path="/stock-transfers" element={<StockTransfersPage />} />
      <Route path="/stock-adjustments" element={<StockAdjustmentsPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
      <Route path="/accounts-payable" element={<AccountsPayablePage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
