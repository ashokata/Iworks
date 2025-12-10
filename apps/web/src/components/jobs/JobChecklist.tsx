import { useState, useEffect } from 'react';
import { ChecklistItem } from '@/types/enhancedTypes';
import { checklistService } from '@/services/checklistService';

interface JobChecklistProps {
  jobId: string;
  readOnly?: boolean;
  onComplete?: () => void;
}

/**
 * Component for displaying and managing job checklists.
 * Based on HouseCallPro's checklist functionality.
 */
export default function JobChecklist({ jobId, readOnly = false, onComplete }: JobChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load checklist data for the job
  useEffect(() => {
    const loadChecklist = async () => {
      setLoading(true);
      try {
        const items = await checklistService.getJobChecklist(jobId);
        setChecklist(items);
        setError(null);
      } catch (err) {
        setError('Failed to load checklist');
        console.error('Error loading checklist:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChecklist();
  }, [jobId]);

  // Handle updating a checklist item
  const handleItemUpdate = async (itemId: string, value: any) => {
    try {
      const updatedItem = await checklistService.updateChecklistItem(jobId, itemId, value);
      if (updatedItem) {
        setChecklist(prev => 
          prev.map(item => item.id === itemId ? { ...item, value, completed: true } : item)
        );
      }
    } catch (err) {
      console.error('Error updating checklist item:', err);
      setError('Failed to update checklist item');
    }
  };

  // Check if all required items are completed
  const allRequiredCompleted = checklist.every(item => 
    !item.required || item.completed
  );

  // Render different item types based on valueType
  const renderChecklistItem = (item: ChecklistItem) => {
    switch (item.valueType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              checked={item.value === true}
              onChange={(e) => !readOnly && handleItemUpdate(item.id, e.target.checked)}
              disabled={readOnly}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="font-medium text-gray-700">
              {item.subject}
              {item.required && <span className="ml-1 text-red-500">*</span>}
            </label>
          </div>
        );
      
      case 'stop_light':
        return (
          <div className="py-2">
            <div className="mb-1 font-medium text-gray-700">
              {item.subject}
              {item.required && <span className="ml-1 text-red-500">*</span>}
            </div>
            <div className="flex space-x-3">
              {['red', 'yellow', 'green'].map((color) => (
                <button
                  key={color}
                  onClick={() => !readOnly && handleItemUpdate(item.id, color)}
                  disabled={readOnly}
                  className={`h-8 w-8 rounded-full ${
                    item.value === color 
                      ? 'ring-2 ring-offset-2 ring-blue-500' 
                      : ''
                  } ${
                    color === 'red' 
                      ? 'bg-red-500' 
                      : color === 'yellow' 
                        ? 'bg-yellow-400' 
                        : 'bg-green-500'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                  aria-label={`Mark as ${color}`}
                />
              ))}
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="py-2">
            <label className="block mb-1 font-medium text-gray-700">
              {item.subject}
              {item.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <textarea
              value={item.value || ''}
              onChange={(e) => !readOnly && handleItemUpdate(item.id, e.target.value)}
              readOnly={readOnly}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Handle completing the checklist
  const handleComplete = () => {
    if (allRequiredCompleted && onComplete) {
      onComplete();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading checklist...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (checklist.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 my-4">
        <p className="text-gray-700">No checklist items for this job.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Job Checklist</h3>
      </div>
      
      <div className="divide-y divide-gray-200 px-4">
        {checklist.sort((a, b) => a.orderIndex - b.orderIndex).map((item) => (
          <div key={item.id} className="py-2">
            {renderChecklistItem(item)}
          </div>
        ))}
      </div>
      
      {!readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleComplete}
            disabled={!allRequiredCompleted}
            className={`px-4 py-2 rounded-md text-white ${
              allRequiredCompleted 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Complete Checklist
          </button>
        </div>
      )}
    </div>
  );
}
