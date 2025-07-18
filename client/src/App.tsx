import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Diagnostic from "@/pages/diagnostic";
import ActionPlan from "@/pages/action-plan";
import Records from "@/pages/records";
import SubprocessorRegistry from "@/pages/subprocessor-registry";
import PrivacyPolicy from "@/pages/privacy-policy";
import BreachAnalysisEnhanced from "@/pages/BreachAnalysisEnhanced";
import RightsManagement from "@/pages/rights-management";
import DPIA from "@/pages/dpia";
import DpiaList from "@/pages/DpiaList";
import DpiaAssessment from "@/pages/DpiaAssessment";
import DpiaAssessmentEnhanced from "@/pages/DpiaAssessmentEnhanced";
import DpiaEvaluationOriginal from "@/pages/DpiaEvaluationOriginal";
import DpiaProcessingSelection from "@/pages/DpiaProcessingSelection";

import Admin from "@/pages/admin";
import UserBackOfficeEnhanced from "@/pages/UserBackOfficeEnhanced";
import Help from "@/pages/help";
import LaTeam from "@/pages/la-team";
import LaTeamChat from "@/pages/la-team-chat";
import Collaborators from "@/pages/collaborators";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Chatbot from "@/components/chatbot/chatbot";

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden ml-64">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/login" component={() => { window.location.href = '/'; return null; }} />
            <Route path="/register" component={() => { window.location.href = '/'; return null; }} />
            <Route path="/" component={Dashboard} />
            <Route path="/diagnostic" component={Diagnostic} />
            <Route path="/actions" component={ActionPlan} />
            <Route path="/records" component={Records} />
            <Route path="/subprocessor-registry" component={SubprocessorRegistry} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/breach-analysis" component={BreachAnalysisEnhanced} />
            <Route path="/rights" component={RightsManagement} />
            <Route path="/dpia" component={DpiaList} />
            <Route path="/dpia/evaluation" component={() => { setLocation('/dpia'); return null; }} />
            <Route path="/dpia/new" component={DpiaProcessingSelection} />
            <Route path="/dpia/:id" component={DpiaAssessmentEnhanced} />
            <Route path="/dpia-old" component={DPIA} />

            <Route path="/admin" component={Admin} />
            <Route path="/user-back-office" component={UserBackOfficeEnhanced} />
            <Route path="/help" component={Help} />
            <Route path="/la-team" component={LaTeam} />
            <Route path="/la-team/chat/:id" component={LaTeamChat} />
            <Route path="/collaborators" component={Collaborators} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}