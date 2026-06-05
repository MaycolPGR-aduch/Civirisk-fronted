import { AlertCircle } from 'lucide-react';

/**
 * Reusable Empty State Component.
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.Component} props.icon
 * @param {React.ReactNode} props.actionButton
 */
const EmptyState = ({
  title = 'No hay datos disponibles',
  description = 'No se encontraron registros en este momento.',
  icon: Icon = AlertCircle,
  actionButton
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
      <div className="p-3 bg-slate-50 rounded-full text-slate-400 mb-3">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
