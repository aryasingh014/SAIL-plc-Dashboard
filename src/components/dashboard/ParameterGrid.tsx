
import React from 'react';
import ParameterCard from '@/components/ParameterCard';
import { Parameter } from '@/types/parameter';

interface ParameterGridProps {
  parameters: Parameter[];
}

const ParameterGrid: React.FC<ParameterGridProps> = ({ parameters }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {parameters.map(parameter => (
        <ParameterCard 
          key={parameter.id} 
          parameter={parameter} 
        />
      ))}
      
      {parameters.length === 0 && (
        <div className="col-span-full text-center p-8">
          <h3 className="text-lg font-medium">No parameters selected</h3>
          <p className="text-muted-foreground">
            Please select parameters to monitor from the list above.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParameterGrid;
