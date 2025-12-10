'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { EntityDefinition, entityModelService } from '@/services/entityModelService';
import { Button } from './ui/Button';

interface EntityRelationProps {
  className?: string;
}

export default function EntityRelationshipsCard({ className }: EntityRelationProps) {
  const [entities, setEntities] = useState<EntityDefinition[]>([]);
  const [activeEntity, setActiveEntity] = useState<string | null>(null);
  const [implementationStatus, setImplementationStatus] = useState<{
    total: number;
    implemented: number;
    partial: number;
    notStarted: number;
    percentComplete: number;
  } | null>(null);
  
  useEffect(() => {
    // Load entities
    const allEntities = entityModelService.getEntityDefinitions();
    setEntities(allEntities);
    
    // Load implementation status
    const status = entityModelService.getImplementationStatus();
    setImplementationStatus(status);
    
    // Set default active entity
    if (allEntities.length > 0) {
      setActiveEntity(allEntities[0].name);
    }
  }, []);

  // Get details for the active entity
  const activeEntityDetails = activeEntity 
    ? entities.find(e => e.name === activeEntity) 
    : null;
    
  // Function to get implementation status color
  const getImplementationColor = (status: boolean | 'partial') => {
    if (status === true) return 'bg-green-100 text-green-800';
    if (status === 'partial') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  // Function to get implementation status text
  const getImplementationText = (status: boolean | 'partial') => {
    if (status === true) return 'Implemented';
    if (status === 'partial') return 'Partial';
    return 'Not Started';
  };
  
  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Field Service Entity Relationships</h2>
      
      {implementationStatus && (
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${implementationStatus.percentComplete}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{implementationStatus.percentComplete}% Complete</span>
          </div>
          <div className="flex text-xs text-gray-600 justify-between">
            <span>{implementationStatus.implemented} implemented</span>
            <span>{implementationStatus.partial} partial</span>
            <span>{implementationStatus.notStarted} not started</span>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
        <div className="flex overflow-x-auto space-x-2 pb-4">
          {entities.map(entity => (
            <Button 
              key={entity.name}
              onClick={() => setActiveEntity(entity.name)}
              variant={activeEntity === entity.name ? 'primary' : 'outline'}
              size="sm"
              className={`whitespace-nowrap ${
                activeEntity === entity.name ? '' : getImplementationColor(entity.implemented)
              }`}
            >
              {entity.name}
            </Button>
          ))}
        </div>
        
        {/* ASCII diagram - would be replaced by a proper visualization in production */}
        <pre className="text-xs font-mono bg-white p-4 rounded border border-gray-200 overflow-auto whitespace-pre">
{`
  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │              │       │              │       │              │
  │  Technician  │───────│  ServiceJob  │───────│   Customer   │
  │              │       │              │       │              │
  └──────┬───────┘       └──────┬───────┘       └──────────────┘
         │                      │
         │                      │
  ┌──────┴───────┐       ┌──────┴───────┐
  │              │       │              │
  │    Skills    │       │ JobMaterial  │
  │              │       │              │
  └──────────────┘       └──────┬───────┘
                                │
  ┌──────────────┐       ┌──────┴───────┐
  │              │       │              │
  │ ServiceArea  │       │  Inventory   │
  │              │       │              │
  └──────────────┘       └──────────────┘
`}</pre>
        
        {activeEntityDetails && (
          <div className="mt-6 p-4 bg-white rounded border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{activeEntityDetails.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getImplementationColor(activeEntityDetails.implemented)}`}>
                {getImplementationText(activeEntityDetails.implemented)}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">{activeEntityDetails.description}</p>
            
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Key Attributes</h4>
              <div className="grid grid-cols-2 gap-2">
                {activeEntityDetails.attributes.slice(0, 6).map(attr => (
                  <div key={attr.name} className="text-xs">
                    <span className="font-medium">{attr.name}</span>
                    <span className="text-gray-500 ml-1">({attr.type})</span>
                    {attr.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                ))}
                {activeEntityDetails.attributes.length > 6 && (
                  <div className="text-xs text-gray-500">
                    +{activeEntityDetails.attributes.length - 6} more attributes
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Relationships</h4>
              <ul className="text-xs space-y-1 list-disc pl-4">
                {activeEntityDetails.relationships.map((rel, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{rel.type}</span> with <span className="font-medium">{rel.targetEntity}</span>: {rel.description}
                  </li>
                ))}
              </ul>
            </div>
            
            {activeEntityDetails.apiEndpoint && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">API Endpoint:</span> {activeEntityDetails.apiEndpoint}
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/docs/Mendix-Mock-Structure/entity-relationship-diagram" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Full Entity Documentation →
          </Link>
        </div>
      </div>
    </Card>
  );
}
