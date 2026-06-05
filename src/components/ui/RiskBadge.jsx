import { getRiskDetails, getRiskDetailsByLevel } from '../../utils/risk';

/**
 * Reusable Risk Badge Component.
 * Can be initialized with a numeric score or a text risk level ('bajo', 'medio', 'alto').
 * @param {Object} props
 * @param {number} [props.score]
 * @param {string} [props.level]
 */
const RiskBadge = ({ score, level }) => {
  const details = score !== undefined 
    ? getRiskDetails(score) 
    : getRiskDetailsByLevel(level);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${details.classes.badge}`}>
      {details.label}
      {score !== undefined && (
        <span className="ml-1.5 px-1 bg-white/60 rounded text-[10px] font-bold">
          {score}
        </span>
      )}
    </span>
  );
};

export default RiskBadge;
