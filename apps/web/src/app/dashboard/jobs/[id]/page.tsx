'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoiceService';
import { EnhancedJob, Invoice } from '@/types/enhancedTypes';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';

interface JobDetailsPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // Mock job data for demonstration (remove this in production)
  const getMockJob = (id: string): EnhancedJob => {
    return {
      id: id,
      tenantId: 'tenant-1',
      title: 'HVAC System Maintenance',
      description: 'Annual maintenance and inspection of heating and cooling systems.',
      status: 'Completed',
      scheduledTime: new Date().toISOString(),
      location: '123 Main St, Anytown, USA',
      customerId: 'customer-1',
      technicianId: 'tech-1',
      checklist: [
        {
          id: 'check-1',
          subject: 'Inspect filters',
          valueType: 'boolean',
          value: true,
          required: true,
          completed: true,
          orderIndex: 0
        },
        {
          id: 'check-2',
          subject: 'Clean condenser coils',
          valueType: 'boolean',
          value: true,
          required: true,
          completed: true,
          orderIndex: 1
        },
        {
          id: 'check-3',
          subject: 'Check refrigerant levels',
          valueType: 'stop_light',
          value: 'green',
          required: true,
          completed: true,
          orderIndex: 2
        }
      ],
      materials: [
        {
          id: 'mat-1',
          name: 'HVAC Filter',
          quantity: 2,
          unitCost: 15.99,
          totalCost: 31.98,
          taxable: true
        },
        {
          id: 'mat-2',
          name: 'Refrigerant',
          quantity: 1,
          unitCost: 45.50,
          totalCost: 45.50,
          taxable: true
        }
      ],
      estimatedDuration: 2,
      jobType: 'Maintenance',
      technicianNotes: 'System is operating efficiently after maintenance. Recommended replacement of the thermostat within the next 6 months.'
    };
  };

  // Fetch job details with fallback to mock data
  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      try {
        // Try to fetch from API first
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          // If API call fails, use mock data
          return getMockJob(jobId);
        }
        return await response.json() as EnhancedJob;
      } catch (error) {
        // If any error occurs, use mock data
        console.log('Using mock job data due to API error:', error);
        return getMockJob(jobId);
      }
    },
  });
  
  // Fetch invoice for this job
  const { 
    data: invoice, 
    isLoading: invoiceLoading, 
    error: invoiceError,
    refetch: refetchInvoice
  } = useQuery({
    queryKey: ['jobInvoice', jobId],
    queryFn: () => invoiceService.getInvoiceForJob(jobId),
  });
  
  // Handle generating an invoice
  const handleGenerateInvoice = async () => {
    try {
      const generatedInvoice = await invoiceService.generateFromJob(jobId);
      if (generatedInvoice) {
        alert('Invoice generated successfully!');
        refetchInvoice();
      } else {
        alert('Failed to generate invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };
  
  // Handle sending an invoice
  const handleSendInvoice = async (method: 'email' | 'sms' | 'mail') => {
    if (!invoice) return;
    
    try {
      const success = await invoiceService.sendInvoice(invoice.id, method);
      if (success) {
        alert(`Invoice sent via ${method} successfully!`);
        refetchInvoice();
        setShowInvoiceModal(false);
      } else {
        alert('Failed to send invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error sending invoice. Please try again.');
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  if (jobLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (jobError || !job) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Error loading job details. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Job Details Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
        <div className="flex items-center mt-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              job.status === 'Completed'
                ? 'bg-green-100 text-green-800'
                : job.status === 'In Progress'
                ? 'bg-blue-100 text-blue-800'
                : job.status === 'Cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {job.status}
          </span>
          <span className="ml-3 text-sm text-gray-500">Job ID: {job.id}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Job Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Job Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Job Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.jobType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.location || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Scheduled Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.scheduledTime).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.estimatedDuration} {job.estimatedDuration === 1 ? 'hour' : 'hours'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.customerId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Technician ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.technicianId}</dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-700">{job.description || 'No description provided.'}</p>
          </div>

          {/* Materials */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Materials</h2>
            {job.materials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {job.materials.map((material) => (
                      <tr key={material.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(material.unitCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(material.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        Total Materials Cost:
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(
                          job.materials.reduce((total, material) => total + material.totalCost, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No materials used for this job.</p>
            )}
          </div>

          {/* Technician Notes (if available) */}
          {job.technicianNotes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Technician Notes</h2>
              <p className="text-sm text-gray-700">{job.technicianNotes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Invoice Section */}
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice</h2>
            
            {invoiceLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : invoice ? (
              <div>
                <dl className="grid grid-cols-1 gap-y-4 mt-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{invoice.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : invoice.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invoice.status === 'VOID'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Invoice
                  </button>
                  
                  {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                    <button
                      type="button"
                      onClick={() => handleSendInvoice('email')}
                      className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Invoice
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoice yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate an invoice to bill the customer for this job.
                </p>
                {job.status === 'Completed' && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleGenerateInvoice}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generate Invoice
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Invoice Details Modal */}
      {showInvoiceModal && invoice && (
        <InvoiceDetails
          invoice={invoice}
          onClose={() => setShowInvoiceModal(false)}
          onSend={handleSendInvoice}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}
