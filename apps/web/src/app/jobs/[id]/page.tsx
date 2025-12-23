'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeftIcon,
  MapPinIcon, 
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon, 
  DocumentTextIcon,
  PaperClipIcon,
  CurrencyDollarIcon,
  PencilIcon,
  CheckIcon,
  ClockIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  DocumentDuplicateIcon,
  CameraIcon,
  ShareIcon,
  UserCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ChevronRightIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import type { Job, JobStatus, JobLineItem } from '@/types/database.types';

// Status configuration with colors and icons
const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  UNSCHEDULED: { label: 'Unscheduled', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', icon: ClockIcon },
  SCHEDULED: { label: 'Scheduled', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', icon: CalendarIcon },
  DISPATCHED: { label: 'Dispatched', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', icon: TruckIcon },
  EN_ROUTE: { label: 'En Route', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-300', icon: TruckIcon },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', icon: WrenchScrewdriverIcon },
  ON_HOLD: { label: 'On Hold', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', icon: ExclamationTriangleIcon },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', icon: CheckCircleIcon },
  INVOICED: { label: 'Invoiced', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-300', icon: DocumentTextIcon },
  PAID: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300', icon: BanknotesIcon },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', icon: XMarkIcon },
};

// Status flow for the rail
const STATUS_FLOW: JobStatus[] = ['SCHEDULED', 'DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED'];

// Priority colors
const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  NORMAL: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  EMERGENCY: { label: 'Emergency', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Helper functions
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Status Rail Component
function StatusRail({ currentStatus, onStatusChange }: { currentStatus: JobStatus; onStatusChange: (status: JobStatus) => void }) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'INVOICED' || currentStatus === 'PAID';
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <XMarkIcon className="h-5 w-5" />
          <span className="font-medium">Job Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        {STATUS_FLOW.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const isPast = index < currentIndex || isCompleted;
          const isCurrent = status === currentStatus;
          const isFuture = index > currentIndex && !isCompleted;

          return (
            <div key={status} className="flex items-center flex-1">
              {/* Status Node */}
              <button
                onClick={() => !isPast && onStatusChange(status)}
                disabled={isPast}
                className={`
                  relative flex flex-col items-center group transition-all duration-200
                  ${isCurrent ? 'scale-110' : 'hover:scale-105'}
                  ${isPast ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isPast ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : ''}
                    ${isCurrent ? `${config.bgColor} ${config.color} ring-4 ring-offset-2 ${config.borderColor} shadow-lg` : ''}
                    ${isFuture ? 'bg-slate-200 text-slate-400' : ''}
                  `}
                >
                  {isPast ? (
                    <CheckCircleSolid className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isPast ? 'text-emerald-600' : ''}
                    ${isCurrent ? config.color : ''}
                    ${isFuture ? 'text-slate-400' : ''}
                  `}
                >
                  {config.label}
                </span>
              </button>

              {/* Connector Line */}
              {index < STATUS_FLOW.length - 1 && (
                <div className="flex-1 mx-2 h-1 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      index < currentIndex || isCompleted ? 'w-full bg-emerald-500' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Customer Card Component
function CustomerCard({ job }: { job: Job }) {
  const customer = job.customer;
  const address = job.address;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">Customer</span>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Customer Name */}
        <div>
          <h3 className="font-semibold text-slate-900">
            {customer?.displayName || 'Unknown Customer'}
          </h3>
          {customer?.companyName && (
            <p className="text-sm text-slate-500">{customer.companyName}</p>
          )}
        </div>

        {/* Address */}
        {address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-slate-600">
              <p>{address.street}</p>
              <p>{address.city}, {address.state} {address.zip}</p>
            </div>
          </div>
        )}

        {/* Phone */}
        {customer?.mobilePhone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon className="h-4 w-4 text-slate-400" />
            <a href={`tel:${customer.mobilePhone}`} className="text-blue-600 hover:underline">
              {customer.mobilePhone}
            </a>
          </div>
        )}

        {/* Email */}
        {customer?.email && (
          <div className="flex items-center gap-2 text-sm">
            <EnvelopeIcon className="h-4 w-4 text-slate-400" />
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline truncate">
              {customer.email}
            </a>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            View Profile
          </Button>
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <PhoneIcon className="h-4 w-4 text-slate-600" />
          </button>
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// AI Suggestions Component
function AISuggestions({ job }: { job: Job }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Mock AI suggestions based on job type
  const suggestions = [
    { name: 'Air Filter Replacement', price: 45 },
    { name: 'Coil Cleaning Service', price: 85 },
  ];

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <SparklesIcon className="h-4 w-4 text-violet-600" />
          </div>
          <span className="font-semibold text-sm text-violet-900">AIRA Suggestion</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-violet-400 hover:text-violet-600">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      
      <p className="text-sm text-violet-700 mb-3">
        Based on the job type, consider adding:
      </p>
      
      <div className="space-y-2 mb-3">
        {suggestions.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-violet-800">• {item.name}</span>
            <span className="font-medium text-violet-600">{formatCurrency(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white flex-1">
          <PlusIcon className="h-3 w-3 mr-1" />
          Add Suggested
        </Button>
        <Button variant="ghost" size="sm" className="text-violet-600" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// Checklist Card Component
function ChecklistCard({ job }: { job: Job }) {
  const checklists = job.checklists || [];
  const totalItems = checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0);
  const completedItems = checklists.reduce(
    (acc, cl) => acc + (cl.items?.filter(item => item.completedAt)?.length || 0),
    0
  );
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">Checklist</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {completedItems}/{totalItems}
        </span>
      </div>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {checklists.length > 0 ? (
          <div className="space-y-2">
            {checklists.slice(0, 3).map((checklist) => (
              <div key={checklist.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {checklist.isCompleted ? (
                    <CheckCircleSolid className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span className={checklist.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}>
                    {checklist.name}
                  </span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-2">No checklists assigned</p>
        )}

        <button className="w-full mt-3 text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View All →
        </button>
      </div>
    </div>
  );
}

// Attachments Card Component
function AttachmentsCard({ job }: { job: Job }) {
  const attachments = job.attachments || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PaperClipIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">Files</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {attachments.length}
        </span>
      </div>

      <div className="p-4">
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.slice(0, 3).map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-2 text-sm">
                {attachment.type === 'PHOTO' ? (
                  <CameraIcon className="h-4 w-4 text-slate-400" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-slate-700 truncate flex-1">{attachment.name || 'Untitled'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-2">No files attached</p>
        )}

        <button className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium">
          <PlusIcon className="h-4 w-4" />
          Add File
        </button>
      </div>
    </div>
  );
}

// Tags Card Component  
function TagsCard({ job }: { job: Job }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          <span className="font-semibold text-sm">Tags</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {job.isCallback && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
              Callback
            </span>
          )}
          {job.priority === 'EMERGENCY' && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              Emergency
            </span>
          )}
          {job.serviceAgreementId && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Membership
            </span>
          )}
        </div>

        <button className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-pink-600 hover:text-pink-700 font-medium">
          <PlusIcon className="h-4 w-4" />
          Add Tag
        </button>
      </div>
    </div>
  );
}

// Line Items Section Component
function LineItemsSection({ job }: { job: Job }) {
  const lineItems = job.lineItems || [];
  const services = lineItems.filter(item => item.type === 'SERVICE' || item.type === 'LABOR');
  const materials = lineItems.filter(item => item.type === 'MATERIAL');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Work Order</h3>
        <div className="flex gap-2">
          <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-50">
            <DocumentDuplicateIcon className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Services */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Services</h4>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
          </div>
          {services.length > 0 ? (
            <div className="space-y-2">
              {services.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-3">No services added</p>
          )}
        </div>

        {/* Materials */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Materials</h4>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
          </div>
          {materials.length > 0 ? (
            <div className="space-y-2">
              {materials.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-3">No materials added</p>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(job.subtotal)}</span>
          </div>
          {job.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Discount</span>
              <span className="font-medium text-green-600">-{formatCurrency(job.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax</span>
            <span className="font-medium">{formatCurrency(job.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
            <span>Total</span>
            <span className="text-emerald-600">{formatCurrency(job.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Actions Bar Component
function QuickActionsBar({ job, onStatusChange }: { job: Job; onStatusChange: (status: JobStatus) => void }) {
  const isCompleted = job.status === 'COMPLETED' || job.status === 'INVOICED' || job.status === 'PAID';
  const canStart = job.status === 'SCHEDULED' || job.status === 'DISPATCHED' || job.status === 'EN_ROUTE';
  const canComplete = job.status === 'IN_PROGRESS';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <LightBulbIcon className="h-5 w-5 text-amber-500" />
        <span className="font-semibold text-sm text-slate-800">Quick Actions</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {canStart && (
          <button
            onClick={() => onStatusChange('IN_PROGRESS')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Start Job</span>
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => onStatusChange('COMPLETED')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Complete</span>
          </button>
        )}
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
          <DocumentTextIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Estimate</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors">
          <DocumentDuplicateIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Invoice</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
          <CurrencyDollarIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Payment</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors">
          <CameraIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Photos</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
          <PencilIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Notes</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-3 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors">
          <ShareIcon className="h-5 w-5" />
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ job }: { job: Job }) {
  // Mock activity data - in real app, this would come from API
  const activities = [
    { id: '1', user: 'Mike Johnson', action: 'viewed job', time: '2m ago', icon: UserCircleIcon },
    { id: '2', user: 'Sarah Williams', action: 'updated notes', time: '15m ago', icon: PencilIcon },
    { id: '3', user: 'System', action: 'job scheduled', time: '1h ago', icon: CalendarIcon },
    { id: '4', user: 'Admin User', action: 'job created', time: '1h ago', icon: PlusIcon },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Live Activity</h3>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="p-1.5 bg-slate-100 rounded-full">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-slate-500">{activity.action}</span>
                </p>
                <p className="text-xs text-slate-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Page Component
export default function JobDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJobById(jobId),
    enabled: isAuthenticated && !!jobId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: JobStatus) => jobService.updateJobStatus(jobId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleStatusChange = (newStatus: JobStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-slate-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Job Not Found</h2>
          <p className="text-slate-500 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.UNSCHEDULED;
  const priorityConfig = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.NORMAL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className={`sticky top-0 z-40 ${statusConfig.bgColor} border-b ${statusConfig.borderColor}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            {/* Left: Back + Job Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/jobs')}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    {job.jobNumber || `JOB-${job.id.slice(0, 6).toUpperCase()}`}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                    {statusConfig.label}
                  </span>
                  {job.priority !== 'NORMAL' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{job.title}</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="secondary" size="sm">
                <ShareIcon className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Rail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <StatusRail currentStatus={job.status} onStatusChange={handleStatusChange} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            <CustomerCard job={job} />
            <AISuggestions job={job} />
            <ChecklistCard job={job} />
            <AttachmentsCard job={job} />
            <TagsCard job={job} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Job Details Row */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Scheduled</p>
                  <p className="font-medium text-slate-800">{formatDate(job.scheduledStart)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="font-medium text-slate-800">{formatDuration(job.estimatedDuration)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                  <p className="font-medium text-slate-800">
                    {job.assignments?.[0]?.employee?.fullName || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Job Type</p>
                  <p className="font-medium text-slate-800">{job.jobType?.name || 'General'}</p>
                </div>
              </div>

              {job.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{job.description}</p>
                </div>
              )}

              {job.internalNotes && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium mb-1">Internal Notes</p>
                  <p className="text-sm text-amber-800">{job.internalNotes}</p>
                </div>
              )}
            </div>

            <LineItemsSection job={job} />
            <QuickActionsBar job={job} onStatusChange={handleStatusChange} />
            <ActivityFeed job={job} />
          </div>
        </div>
      </div>

      {/* AIRA Chat Bar (Fixed Bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-full border border-slate-200 shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-full">
            <SparklesIcon className="h-5 w-5 text-violet-600" />
          </div>
          <input
            type="text"
            placeholder="Ask AIRA anything about this job..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm placeholder:text-slate-400"
          />
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 rounded-full">
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}
