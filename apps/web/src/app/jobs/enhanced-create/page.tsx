'use client';

import { useState } from 'react';
import { JobTemplate } from '@/types/enhancedTypes';
import JobTemplateSelect from '@/components/jobs/JobTemplateSelect';
import JobChecklist from '@/components/jobs/JobChecklist';
import JobMaterials from '@/components/jobs/JobMaterials';
import ServiceCatalog from '@/components/services/ServiceCatalog';

/**
 * Enhanced job creation page with templates, checklists and service catalog.
 * Based on HouseCallPro's comprehensive job management
 */
export default function EnhancedJobCreate() {
  const [jobId, setJobId] = useState<string | null>(null); // Would be set after creating job
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'details' | 'checklist' | 'review'>('template');

  // Handle template selection
  const handleTemplateSelected = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('details');
  };

  // Handle form submission to create job
  const handleCreateJob = () => {
    // In a real implementation, this would call an API to create the job
    const mockJobId = 'job-' + Date.now();
    setJobId(mockJobId);
    setCurrentStep('checklist');
  };

  // Handle checklist completion
  const handleChecklistComplete = () => {
    setCurrentStep('review');
  };

  // Render different steps of the job creation process
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'template':
        return <JobTemplateSelect onTemplateSelected={handleTemplateSelected} />;
      
      case 'details':
        return (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Job Details
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedTemplate 
                  ? `Using template: ${selectedTemplate.name}`
                  : 'Add job details'
                }
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <form className="space-y-6">
                <div>
                  <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="job-title"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      defaultValue={selectedTemplate?.name}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="job-description"
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      defaultValue={selectedTemplate?.description}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="job-type" className="block text-sm font-medium text-gray-700">
                    Job Type
                  </label>
                  <select
                    id="job-type"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    defaultValue={selectedTemplate?.jobType}
                  >
                    <option value="Install">Install</option>
                    <option value="Repair">Repair</option>
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleCreateJob}
                    >
                      Create Job
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      
      case 'checklist':
        return jobId ? (
          <div className="space-y-6">
            <JobChecklist 
              jobId={jobId} 
              onComplete={handleChecklistComplete} 
            />
            <JobMaterials 
              jobId={jobId}
            />
          </div>
        ) : (
          <div>Error: Job ID not found.</div>
        );
      
      case 'review':
        return (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Job Created Successfully
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Job ID: {jobId}
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Job has been created successfully with all required information.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900">Next Steps:</h4>
                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-gray-500">
                  <li>Schedule this job with a technician</li>
                  <li>Send job information to the customer</li>
                  <li>Prepare necessary materials</li>
                </ul>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.location.href = '/jobs'}
              >
                Go to Jobs List
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Create Job</h1>
      </div>
      
      {/* Progress steps */}
      <div className="py-5">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            <li className={`relative pr-8 sm:pr-20 ${
              currentStep === 'template' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'template' ? 'bg-blue-100' : 
                  currentStep === 'details' || currentStep === 'checklist' || currentStep === 'review' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className="text-sm font-medium">1</span>
                </div>
                <span className="ml-4 text-sm font-medium">Select Template</span>
              </div>
            </li>

            <li className={`relative pr-8 sm:pr-20 ${
              currentStep === 'details' ? 'text-blue-600' : 
              currentStep === 'checklist' || currentStep === 'review' ? 'text-green-600' : 'text-gray-500'
            }`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'details' ? 'bg-blue-100' : 
                  currentStep === 'checklist' || currentStep === 'review' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className="text-sm font-medium">2</span>
                </div>
                <span className="ml-4 text-sm font-medium">Job Details</span>
              </div>
            </li>

            <li className={`relative pr-8 sm:pr-20 ${
              currentStep === 'checklist' ? 'text-blue-600' : 
              currentStep === 'review' ? 'text-green-600' : 'text-gray-500'
            }`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'checklist' ? 'bg-blue-100' : 
                  currentStep === 'review' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className="text-sm font-medium">3</span>
                </div>
                <span className="ml-4 text-sm font-medium">Checklist</span>
              </div>
            </li>

            <li className={`relative ${
              currentStep === 'review' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep === 'review' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <span className="text-sm font-medium">4</span>
                </div>
                <span className="ml-4 text-sm font-medium">Review</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Current step content */}
      <div className="mt-6">
        {renderCurrentStep()}
      </div>

      {/* Service catalog section (always shown for reference) */}
      {(currentStep === 'details' || currentStep === 'checklist') && (
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Service Catalog</h2>
          <ServiceCatalog />
        </div>
      )}
    </div>
  );
}
