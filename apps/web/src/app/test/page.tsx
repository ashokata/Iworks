'use client';

import EntityRelationshipsCard from '@/components/EntityRelationshipsCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Field Service Entity Model</h1>
          <p className="text-gray-600">
            This page demonstrates the entity relationships in the InField Works system
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EntityRelationshipsCard />
          
          {/* Entity Quick Navigation */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Customer', 'Technician', 'Invoice', 'ServiceJob', 'Employee', 'Schedule', 'Inventory', 'ServiceArea'].map(entity => (
              <Card key={entity} className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-500">
                <h3 className="font-medium">{entity}</h3>
                <p className="text-xs text-gray-500 mt-1">View entity details</p>
              </Card>
            ))}
          </div>
          
          {/* Visualization Preview */}
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Job Workflow Visualization</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Request</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Complete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Issues</span>
                </div>
              </div>
              
              <div className="relative h-16">
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-300 -translate-y-1/2"></div>
                <div className="absolute left-0 w-3/4 top-1/2 h-1 bg-blue-500 -translate-y-1/2"></div>
                
                <div className="absolute left-0 top-1/2 w-6 h-6 bg-blue-500 rounded-full -translate-y-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xs">1</div>
                
                <div className="absolute left-1/4 top-1/2 w-6 h-6 bg-blue-500 rounded-full -translate-y-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xs">2</div>
                
                <div className="absolute left-2/4 top-1/2 w-6 h-6 bg-yellow-500 rounded-full -translate-y-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xs">3</div>
                
                <div className="absolute left-3/4 top-1/2 w-6 h-6 bg-yellow-500 rounded-full -translate-y-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xs">4</div>
                
                <div className="absolute right-0 top-1/2 w-6 h-6 bg-gray-300 rounded-full -translate-y-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xs">5</div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Request</span>
                <span>Scheduled</span>
                <span>In Progress</span>
                <span>Completed</span>
                <span>Invoice</span>
              </div>
              
              <div className="text-center mt-6">
                <a 
                  href="/docs/Mendix-Mock-Structure/entity-relationship-diagram.md#job-status-workflow" 
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  target="_blank"
                >
                  View Complete Workflow Diagram
                </a>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Documentation Links</h2>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/docs/Mendix-Mock-Structure/index.md" 
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  target="_blank"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                  </svg>
                  Current Implementation Docs
                </a>
              </li>
              <li>
                <a 
                  href="/docs/mendix-model/index.md" 
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  target="_blank"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                  </svg>
                  Ideal Mendix Model Docs
                </a>
              </li>
              <li>
                <a 
                  href="/docs/Mendix-Mock-Structure/entity-relationship-diagram.md" 
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  target="_blank"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                  </svg>
                  Entity Relationship Diagram
                </a>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Implementation Status</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="ml-4 text-sm font-medium">45%</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Technician Entity</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ServiceJob Entity</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer Entity</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skills Implementation</span>
                  <span className="text-yellow-600">⚠ Partial</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Schedule System</span>
                  <span className="text-yellow-600">⚠ Partial</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Invoice Management</span>
                  <span className="text-yellow-600">⚠ Partial</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Employee Management</span>
                  <span className="text-red-600">✕ Not Started</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>JobMaterial Entity</span>
                  <span className="text-red-600">✕ Not Started</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold mb-4">Development Timeline</h2>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-0 w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="font-medium">Current Sprint</div>
                  <div className="text-xs text-gray-500">July 21 - August 3, 2025</div>
                  <div className="mt-1 text-sm">Implementing Customer entity enhancements</div>
                </div>
                
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-0 w-8 h-8 bg-indigo-400 rounded-full text-white flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="font-medium">Next Sprint</div>
                  <div className="text-xs text-gray-500">August 4 - 17, 2025</div>
                  <div className="mt-1 text-sm">Employee system and scheduling integration</div>
                </div>
                
                <div className="relative pl-10">
                  <div className="absolute left-0 w-8 h-8 bg-gray-300 rounded-full text-white flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="font-medium">Future Sprint</div>
                  <div className="text-xs text-gray-500">August 18 - 31, 2025</div>
                  <div className="mt-1 text-sm">Invoice system and payment processing</div>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <a 
                  href="/docs/Mendix-Mock-Structure/entity-relationship-diagram.md#next-implementation-steps" 
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  target="_blank"
                >
                  View Complete Implementation Roadmap
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
