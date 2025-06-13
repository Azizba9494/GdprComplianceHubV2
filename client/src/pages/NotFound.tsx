import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Page non trouvée
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}