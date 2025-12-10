import React, { useState, useEffect } from 'react';
import { invoiceService } from '@/services/invoiceService';
import InvoiceDetails from './InvoiceDetails';
import { Invoice } from '@/types/enhancedTypes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface JobInvoiceContainerProps {
  jobId: string;
  readOnly?: boolean;
}

export default function JobInvoiceContainer({ jobId, readOnly = false }: JobInvoiceContainerProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Try to get existing invoice for job
        const fetchedInvoice = await invoiceService.getInvoiceForJob(jobId);
        setInvoice(fetchedInvoice);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [jobId]);

  const handleGenerateInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedInvoice = await invoiceService.generateFromJob(jobId);
      if (generatedInvoice) {
        setInvoice(generatedInvoice);
      } else {
        setError("Failed to generate invoice");
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      setError("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (method: 'email' | 'sms' | 'mail') => {
    if (!invoice) return;
    
    setSending(true);
    try {
      const success = await invoiceService.sendInvoice(invoice.id, method);
      if (!success) {
        setError("Failed to send invoice");
      } else {
        // Close the invoice view after successful send
        setShowInvoice(false);
      }
    } catch (err) {
      console.error("Error sending invoice:", err);
      setError("Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p>Loading invoice information...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => setError(null)}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="mb-4">No invoice has been generated for this job yet.</p>
          {!readOnly && (
            <Button 
              variant="outline" 
              onClick={handleGenerateInvoice}
            >
              Generate Invoice
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Invoice #{invoice.id}</h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className={
                  invoice.status === 'Paid' ? 'text-green-600' : 
                  invoice.status === 'Overdue' ? 'text-red-600' : 
                  'text-gray-600'
                }>{invoice.status}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowInvoice(true)}
              >
                View Invoice
              </Button>
              {!readOnly && invoice.status !== 'Paid' && (
                <Button
                  variant="primary"
                  onClick={() => handleSendInvoice('email')}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Send to Customer'}
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="font-medium">Total Amount: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(invoice.total)}</p>
          </div>
        </div>
      </Card>

      {showInvoice && (
        <InvoiceDetails 
          invoice={invoice} 
          onClose={() => setShowInvoice(false)} 
          onSend={!readOnly ? handleSendInvoice : undefined}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
