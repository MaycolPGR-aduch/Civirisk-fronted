import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Página No Encontrada
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Lo sentimos, el recurso que está buscando no existe o no tiene permisos para acceder a él.
          </p>
        </div>
        
        <div className="pt-4">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 font-semibold text-sm cursor-pointer transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel Principal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
