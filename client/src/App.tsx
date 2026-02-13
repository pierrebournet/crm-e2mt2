import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Batiments from "./pages/Batiments";
import Interventions from "./pages/Interventions";
import InterventionDetail from "./pages/InterventionDetail";
import NewIntervention from "./pages/NewIntervention";
import Alertes from "./pages/Alertes";
import ExportPage from "./pages/ExportPage";
import BpuPage from "./pages/BpuPage";
import DevisPage, { DevisDetailPage } from "./pages/DevisPage";
import AssistantPage from "./pages/AssistantPage";
import SuiviPage from "./pages/SuiviPage";
import TutorielsPage from "./pages/TutorielsPage";
import NommagePage from "./pages/NommagePage";
import ReferentielContratPage from "./pages/ReferentielContratPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/batiments" component={Batiments} />
        <Route path="/interventions" component={Interventions} />
        <Route path="/interventions/new" component={NewIntervention} />
        <Route path="/interventions/:id" component={InterventionDetail} />
        <Route path="/alertes" component={Alertes} />
        <Route path="/export" component={ExportPage} />
        <Route path="/bpu" component={BpuPage} />
        <Route path="/devis" component={DevisPage} />
        <Route path="/devis/:id">{(params) => <DevisDetailPage params={params} />}</Route>
        <Route path="/suivi" component={SuiviPage} />
        <Route path="/assistant" component={AssistantPage} />
        <Route path="/tutoriels" component={TutorielsPage} />
        <Route path="/nommage" component={NommagePage} />
        <Route path="/referentiel" component={ReferentielContratPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
