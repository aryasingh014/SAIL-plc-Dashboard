
import React from 'react';
import { Button } from "@/components/ui/button";
import { Parameter } from '@/types/parameter';

interface ParameterSelectorProps {
  parameters: Parameter[];
  selectedParameters: string[];
  toggleParameterSelection: (parameterId: string) => void;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  parameters,
  selectedParameters,
  toggleParameterSelection
}) => {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h2 className="text-lg font-medium mb-2">Selected Parameters</h2>
      <div className="flex flex-wrap gap-2">
        {parameters.map(parameter => (
          <Button 
            key={parameter.id}
            variant={selectedParameters.includes(parameter.id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleParameterSelection(parameter.id)}
            className={selectedParameters.includes(parameter.id) ? "bg-industrial-blue hover:bg-industrial-blue-light" : ""}
          >
            {parameter.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ParameterSelector;
