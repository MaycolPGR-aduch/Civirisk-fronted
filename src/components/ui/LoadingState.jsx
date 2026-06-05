import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Spinner Component.
 * @param {Object} props
 * @param {string} props.message
 */
const LoadingState = ({ message = 'Cargando datos...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};

export default LoadingState;
