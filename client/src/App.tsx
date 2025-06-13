import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Home from "@/pages/Home";
import Dashboard from "@/pages/dashboard";
import Diagnostic from "@/pages/diagnostic";
import ActionPlan from "@/pages/action-plan";
import Records from "@/pages/records";
import PrivacyPolicy from "@/pages/privacy-policy";
import BreachAnalysis from "@/pages/breach-analysis";
import RightsManagement from "@/pages/rights-management";
import DPIA from "@/pages/dpia";
import DpiaList from "@/pages/DpiaList";
import DpiaAssessment from "@/pages/DpiaAssessment";
import DpiaAssessmentEnhanced from "@/pages/DpiaAssessmentEnhanced";
import DpiaEvaluationOriginal from "@/pages/DpiaEvaluationOriginal";
import DpiaProcessingSelection from "@/pages/DpiaProcessingSelection";
import Learning from "@/pages/learning";
import Admin from "@/pages/admin";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Chatbot from "@/components/chatbot/chatbot";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mode développement - accès direct sans authentification
  const isDevelopment = import.meta.env.NODE_ENV === 'development';

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      {isLoading || (!isAuthenticated && !isDevelopment) ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="*">
            <AuthenticatedApp />
          </Route>
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />
        
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/diagnostic" component={Diagnostic} />
            <Route path="/actions" component={ActionPlan} />
            <Route path="/records" component={Records} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/breach-analysis" component={BreachAnalysis} />
            <Route path="/rights" component={RightsManagement} />
            <Route path="/dpia" component={DpiaList} />
            <Route path="/dpia/evaluation" component={DpiaEvaluationOriginal} />
            <Route path="/dpia/new" component={DpiaProcessingSelection} />
            <Route path="/dpia/:id" component={DpiaAssessmentEnhanced} />
            <Route path="/dpia-old" component={DPIA} />
            <Route path="/learning" component={Learning} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
