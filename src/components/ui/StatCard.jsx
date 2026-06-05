/**
 * Reusable Statistic Card Component.
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {string} [props.description]
 * @param {React.Component} [props.icon]
 * @param {string} [props.trendText]
 * @param {boolean} [props.trendIsPositive]
 */
const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trendText,
  trendIsPositive = true
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex justify-between items-center transition-all hover:shadow-md duration-200">
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-xs font-medium text-slate-500">
            {description}
          </p>
        )}
        {trendText && (
          <div className="flex items-center text-xs font-semibold mt-1">
            <span className={trendIsPositive ? 'text-emerald-600' : 'text-red-500'}>
              {trendText}
            </span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
//
