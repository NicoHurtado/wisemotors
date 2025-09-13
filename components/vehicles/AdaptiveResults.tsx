'use client';

import { SubjectiveResults } from './SubjectiveResults';
import { ObjectiveResults } from './ObjectiveResults';
import { HybridResults } from './HybridResults';

export interface AdaptiveResultsProps {
  results: any;
  query: string;
  onFilterClick?: (newQuery: string) => void;
}

export function AdaptiveResults({ results, query, onFilterClick }: AdaptiveResultsProps) {
  if (!results || !results.query_type) {
    return null;
  }

  switch (results.query_type) {
    case 'SUBJECTIVE_PREFERENCE':
      return <SubjectiveResults results={results} query={query} onFilterClick={onFilterClick} />;
      
    case 'OBJECTIVE_FEATURE':
      return <ObjectiveResults results={results} query={query} />;
      
    case 'HYBRID':
      return <HybridResults results={results} query={query} onFilterClick={onFilterClick} />;
      
    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Tipo de consulta no reconocido</p>
        </div>
      );
  }
}
