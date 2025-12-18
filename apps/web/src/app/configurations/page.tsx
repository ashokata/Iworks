'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheckIcon,
  TagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ListBulletIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ConfigurationTile {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

const configurationTiles: ConfigurationTile[] = [
  {
    id: 'roles',
    name: 'Employee Roles',
    description: 'Manage roles and permissions, assign roles to employees',
    icon: ShieldCheckIcon,
    href: '/configurations/roles',
    color: 'bg-blue-500',
  },
  {
    id: 'lead-sources',
    name: 'Lead Sources',
    description: 'Manage customer lead sources',
    icon: BuildingOfficeIcon,
    href: '/configurations/lead-sources',
    color: 'bg-green-500',
  },
  {
    id: 'tags',
    name: 'Tags',
    description: 'Manage tags for customers, jobs, and employees',
    icon: TagIcon,
    href: '/configurations/tags',
    color: 'bg-purple-500',
  },
  {
    id: 'skills',
    name: 'Skills',
    description: 'Manage employee skills and certifications',
    icon: WrenchScrewdriverIcon,
    href: '/configurations/skills',
    color: 'bg-orange-500',
  },
  {
    id: 'job-types',
    name: 'Job Types',
    description: 'Manage job types and their default settings',
    icon: BriefcaseIcon,
    href: '/configurations/job-types',
    color: 'bg-indigo-500',
  },
  {
    id: 'labor-rates',
    name: 'Labor Rates',
    description: 'Manage hourly rates and multipliers',
    icon: CurrencyDollarIcon,
    href: '/configurations/labor-rates',
    color: 'bg-yellow-500',
  },
  {
    id: 'permissions',
    name: 'Permissions',
    description: 'View all available permissions and their categories',
    icon: ShieldCheckIcon,
    href: '/configurations/permissions',
    color: 'bg-red-500',
  },
  {
    id: 'pricebook',
    name: 'Pricebook',
    description: 'Browse catalog of industry-specific service templates',
    icon: BookOpenIcon,
    href: '/pricebook',
    color: 'bg-teal-500',
  },
  {
    id: 'manage-catalog',
    name: 'Manage Catalog',
    description: 'Create and manage service catalog categories',
    icon: RectangleStackIcon,
    href: '/pricebook/manage',
    color: 'bg-cyan-500',
  },
  {
    id: 'service-requests',
    name: 'Service Requests',
    description: 'View and manage service requests from voice agents',
    icon: ClipboardDocumentListIcon,
    href: '/service-requests',
    color: 'bg-pink-500',
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'View financial summaries, job metrics, and analytics',
    icon: ChartBarIcon,
    href: '/reports',
    color: 'bg-emerald-500',
  },
];

export default function ConfigurationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Configurations</h1>
              <p className="text-sm text-blue-100">Manage master data and lookup tables for your organization</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white text-[#1a2a6c] rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurationTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.id}
                onClick={() => router.push(tile.href)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start">
                  <div className={`${tile.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tile.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{tile.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

