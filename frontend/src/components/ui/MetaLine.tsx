import React from 'react';

/**
 * A line of short facts (reward, progress, rank, percentile). A hairline sits only between facts that share a line:
 * at every wrap it is clipped out, so a separator can never dangle at the end or the start of a line the way an inline
 * "·" does. Pass one child per fact; falsy children are skipped.
 */
export function MetaLine({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;
  return (
    <div className={`ui-meta ${className}`}>
      <div className="ui-meta__track">
        {items.map((item, index) => <span key={index} className="ui-meta__item">{item}</span>)}
      </div>
    </div>
  );
}
