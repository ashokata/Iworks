import { useState, useEffect } from 'react';
import { JobTemplate } from '@/types/enhancedTypes';
import { jobTemplateService } from '@/services/jobTemplateService';

interface JobTemplateSelectProps {
  onTemplateSelected: (template: JobTemplate) => void;
}

/**
 * Component for selecting job templates.
 * Based on HouseCallPro's job template functionality.
 */
export default function JobTemplateSelect({ onTemplateSelected }: JobTemplateSelectProps) {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const fetchedTemplates = await jobTemplateService.getTemplates();
        setTemplates(fetchedTemplates);
        setError(null);
      } catch (err) {
        setError('Failed to load job templates');
        console.error('Error loading job templates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates based on search and job type filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobType = selectedJobType === null || 
      template.jobType === selectedJobType;
    
    return matchesSearch && matchesJobType;
  });

  // Get unique job types for filter options
  const jobTypes = Array.from(new Set(templates.map(template => template.jobType)));

  if (loading) {
    return <div className="flex justify-center p-4">Loading job templates...</div>;
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

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Select a Job Template
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose a template to quickly create a standardized job
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="template-search" className="sr-only">Search templates</label>
          <input
            type="text"
            id="template-search"
            placeholder="Search templates..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="job-type-filter" className="sr-only">Filter by job type</label>
          <select
            id="job-type-filter"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={selectedJobType || ''}
            onChange={(e) => setSelectedJobType(e.target.value || null)}
          >
            <option value="">All job types</option>
            {jobTypes.map(jobType => (
              <option key={jobType} value={jobType}>{jobType}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Template list */}
      <div className="overflow-y-auto max-h-96">
        {filteredTemplates.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No templates match your search criteria.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <li key={template.id} className="hover:bg-gray-50">
                <button
                  onClick={() => onTemplateSelected(template)}
                  className="w-full text-left px-4 py-4 focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{template.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.jobType}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span>{template.serviceIds.length} service(s)</span>
                    <span className="mx-2">•</span>
                    <span>{template.materialIds.length} material(s)</span>
                    <span className="mx-2">•</span>
                    <span>{template.checklistTemplateIds.length} checklist(s)</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
        <button
          type="button"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => alert('Create New Template functionality will be implemented')}
        >
          Create New Template
        </button>
      </div>
    </div>
  );
}
