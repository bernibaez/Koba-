import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/AppIcon';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-onBackground mb-2">Página no encontrada</h2>
        <p className="text-onBackground/70 mb-8">
          La página que buscas no existe. Vamos a llevarte de vuelta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            Volver
          </button>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <Icon name="HomeIcon" size={16} />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
