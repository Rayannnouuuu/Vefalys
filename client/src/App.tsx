import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import ContactsListPage from './pages/ContactsListPage'
import ContactDetailPage from './pages/ContactDetailPage'
import PipelinePage from './pages/PipelinePage'
import RelancesPage from './pages/RelancesPage'
import FacturesListPage from './pages/FacturesListPage'
import FactureDetailPage from './pages/FactureDetailPage'
import DepensesPage from './pages/DepensesPage'
import FinancesPage from './pages/FinancesPage'
import SimulationFinancierePage from './pages/SimulationFinancierePage'
import AgendaPage from './pages/AgendaPage'
import TasksPage from './pages/TasksPage'
import SettingsLayout from './pages/settings/SettingsLayout'
import MyAccountPage from './pages/settings/MyAccountPage'
import TeamPage from './pages/settings/TeamPage'
import PermissionsPage from './pages/settings/PermissionsPage'
import CalendlySettingsPage from './pages/settings/CalendlySettingsPage'
import DataPage from './pages/settings/DataPage'
import ActivityPage from './pages/settings/ActivityPage'
import MentionsLegalesPage from './pages/legal/MentionsLegalesPage'
import CGUPage from './pages/legal/CGUPage'
import ConfidentialitePage from './pages/legal/ConfidentialitePage'

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/verifier-email" element={<VerifyEmailPage />} />
      <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="/cgu" element={<CGUPage />} />
      <Route path="/confidentialite" element={<ConfidentialitePage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsListPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/relances" element={<RelancesPage />} />
          <Route path="/factures" element={<FacturesListPage />} />
          <Route path="/factures/:id" element={<FactureDetailPage />} />
          <Route path="/depenses" element={<DepensesPage />} />
          <Route path="/finances" element={<FinancesPage />} />
          <Route path="/simulation" element={<SimulationFinancierePage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/taches" element={<TasksPage />} />
          <Route path="/parametres" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/parametres/compte" replace />} />
            <Route path="compte" element={<MyAccountPage />} />
            <Route path="equipe" element={<TeamPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="calendly" element={<CalendlySettingsPage />} />
            <Route path="donnees" element={<DataPage />} />
            <Route path="activite" element={<ActivityPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
