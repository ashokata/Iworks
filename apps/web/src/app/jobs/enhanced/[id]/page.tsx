'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EnhancedJob, Invoice } from '@/types/enhancedTypes';
import JobChecklist from '@/components/jobs/JobChecklist';
import JobMaterials from '@/components/jobs/JobMaterials';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import { invoiceService } from '@/services/invoiceService';

// Mock job service - would normally fetch from API
const getJobById = async (id: string): Promise<EnhancedJob> => {
  // Simulating API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        tenantId: 'tenant-1',
        title: 'HVAC Maintenance Service',
        description: 'Annual maintenance service for central air system',
        status: 'Scheduled',
        scheduledTime: new Date().toISOString(),
        customerId: 'customer-123',
        technicianId: 'tech-456',
        location: '123 Main St, Anytown, USA',
        checklist: [
          {
            id: 'check-1',
            subject: 'Check air filter',
            valueType: 'boolean',
            value: true,
            required: true,
            completed: true,
            orderIndex: 1
          },
          {
            id: 'check-2',
            subject: 'Test cooling performance',
            valueType: 'stop_light',
            value: 'green',
            required: true,
            completed: true,
            orderIndex: 2
          },
          {
            id: 'check-3',
            subject: 'Technician notes',
            valueType: 'text',
            value: 'System is working properly. Recommended cleaning condenser coils next visit.',
            required: false,
            completed: true,
            orderIndex: 3
          }
        ],
        template: '3',
        materials: [
          {
            id: 'mat-1',
            name: 'Air Filter 16x25x1',
            quantity: 1,
            unitCost: 21.99,
            totalCost: 21.99,
            taxable: true
          },
          {
            id: 'mat-2',
            name: 'Cleaning Solution',
            quantity: 2,
            unitCost: 9.99,
            totalCost: 19.98,
            taxable: true
          }
        ],
        estimatedDuration: 120,
        jobType: 'Maintenance',
        technicianNotes: 'Customer mentioned concern about noise when unit starts up. Inspected and found no issues - normal operation.',
        business_unit: 'Residential'
      });
    }, 500);
  });
};

export default function EnhancedJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<EnhancedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const loadJobData = async () => {
      setLoading(true);
      try {
        const jobData = await getJobById(id);
        setJob(jobData);
        
        // Try to fetch invoice for this job if job is completed
        if (jobData.status === 'Completed') {
          try {
            const invoiceData = await invoiceService.getInvoiceForJob(jobData.id);
            setInvoice(invoiceData);
          } catch (invoiceErr) {
            // No invoice found or error fetching invoice
            console.log('No existing invoice found');
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load job details');
        console.error('Error loading job:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJobData();
  }, [id]);

  // Handle going back to jobs list
  const handleBackToJobs = () => {
    router.push('/jobs');
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Job not found'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleBackToJobs}
            className="mt-3 text-sm font-medium text-red-700 hover:text-red-600"
          >
            Return to Jobs List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="lg:flex lg:items-center lg:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <button
                    onClick={handleBackToJobs}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Jobs
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">{job.id}</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {job.title}
          </h2>
          
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {formatDate(job.scheduledTime)}
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {job.location}
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Customer ID: {job.customerId}
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Technician ID: {job.technicianId}
            </div>
          </div>
        </div>
        
        <div className="mt-5 flex lg:mt-0 lg:ml-4">
          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
            job.status === 'Completed' 
              ? 'bg-green-100 text-green-800'
              : job.status === 'Scheduled'
                ? 'bg-blue-100 text-blue-800'
                : job.status === 'In Progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
          }`}>
            {job.status}
          </span>
        </div>
      </div>
      
      {/* Job details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main info */}
        <div className="col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Job Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {job.jobType} - {job.estimatedDuration} minutes estimated
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Job Type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {job.jobType}
                  </dd>
                </div>
                
                {job.business_unit && (
                  <div className="mt-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Business Unit
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {job.business_unit}
                    </dd>
                  </div>
                )}
                
                <div className="mt-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {job.description}
                  </dd>
                </div>
                
                {job.technicianNotes && (
                  <div className="mt-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Technician Notes
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {job.technicianNotes}
                    </dd>
                  </div>
                )}
                
                {job.template && (
                  <div className="mt-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Template Used
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      Template ID: {job.template}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Checklist section */}
          <div className="mt-6">
            <JobChecklist jobId={job.id} readOnly={job.status === 'Completed'} />
          </div>
          
          {/* Materials section */}
          <div className="mt-6">
            <JobMaterials jobId={job.id} readOnly={job.status === 'Completed'} />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="col-span-1">
          {/* Status and actions */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Job Status
              </h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Current Status</span>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={job.status}
                    onChange={() => {}} // Would update status in a real app
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Contact Customer
                  </button>
                </div>
                
                <div>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Process Payment
                  </button>
                </div>
                
                <div>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={async () => {
                      if (invoice) {
                        setShowInvoice(true);
                      } else if (job) {
                        // Generate new invoice
                        const generatedInvoice = await invoiceService.generateFromJob(job.id);
                        if (generatedInvoice) {
                          setInvoice(generatedInvoice);
                          setShowInvoice(true);
                        }
                      }
                    }}
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    {invoice ? 'View Invoice' : 'Generate Invoice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer information preview */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer Information
              </h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                    {job.customerId.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">Customer ID: {job.customerId}</h4>
                  <p className="text-sm text-gray-500">View full customer details</p>
                </div>
              </div>
              
              <div className="mt-4 text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Customer History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Invoice Modal */}
    {showInvoice && invoice && job && (
      <InvoiceDetails 
        invoice={invoice as Invoice} 
        onClose={() => setShowInvoice(false)}
        onSend={async (method) => {
          if (invoice) {
            try {
              await invoiceService.sendInvoice(invoice.id, method);
              alert(`Invoice sent successfully via ${method}!`);
            } catch (error) {
              console.error('Error sending invoice:', error);
              alert('Failed to send invoice. Please try again.');
            }
          }
        }}
        onPrint={() => window.print()}
      />
    )}
    </>
  );
}
