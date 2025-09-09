'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Car, Building2, Star, Settings } from 'lucide-react';
import { VehiclesTable } from './VehiclesTable';
import { DealershipsTable } from './DealershipsTable';
import { TrendingManagement } from './TrendingManagement';

type TabType = 'vehicles' | 'dealerships' | 'trending';

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Administrador
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin/vehicles/new')}
                className="inline-flex items-center px-4 py-2 bg-wise text-white rounded-lg hover:bg-wise-dark transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Vehículo
              </button>
              <button
                onClick={() => router.push('/admin/dealerships/new')}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Concesionario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vehicles'
                  ? 'border-wise text-wise'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Car className="w-4 h-4 inline mr-2" />
              Vehículos
            </button>
            <button
              onClick={() => setActiveTab('dealerships')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dealerships'
                  ? 'border-wise text-wise'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Concesionarios
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trending'
                  ? 'border-wise text-wise'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Trending
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'vehicles' ? (
            <VehiclesTable />
          ) : activeTab === 'dealerships' ? (
            <DealershipsTable />
          ) : (
            <div className="p-6">
              <TrendingManagement onClose={() => setActiveTab('vehicles')} />
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
