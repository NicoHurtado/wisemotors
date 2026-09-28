'use client';

import { useState, useEffect } from 'react';
import { useWhatsAppLeads, WhatsAppLead } from '@/hooks/useWhatsAppLeads';
import { formatPrice } from '@/lib/utils';
import { 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  Car,
  Building,
  MessageSquare,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WhatsAppLeadsTableProps {
  className?: string;
}

const statusColors = {
  'Nuevo': 'bg-wise/10 text-wise',
  'Contactado': 'bg-[#fce7f3] text-[#db2777]',
  'Interesado': 'bg-purple-100 text-purple-800',
  'Vendido': 'bg-wise/10 text-wise',
  'Perdido': 'bg-red-100 text-red-800',
};

const sourceLabels = {
  'website': 'Sitio Web',
  'specific_dealership': 'Concesionario Específico',
  'home_delivery': 'Testdrive a Casa',
};

export function WhatsAppLeadsTable({ className = '' }: WhatsAppLeadsTableProps) {
  const {
    leads,
    loading,
    error,
    fetchLeads,
    updateLeadStatus,
    deleteLead,
    exportLeads
  } = useWhatsAppLeads();

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    fetchLeads({ page: currentPage, limit: 20 });
  }, [currentPage]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const success = await updateLeadStatus(leadId, newStatus);
    if (success) {
      // Refrescar la lista
      fetchLeads({ page: currentPage, limit: 20 });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      const success = await deleteLead(leadId);
      if (success) {
        fetchLeads({ page: currentPage, limit: 20 });
      }
    }
  };

  const handleExport = async () => {
    const success = await exportLeads({ status: filters.status });
    if (success) {
      alert('Exportación completada exitosamente');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = !filters.status || lead.status === filters.status;
    const matchesSearch = !filters.search || 
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (lead.vehicleBrand && lead.vehicleBrand.toLowerCase().includes(filters.search.toLowerCase())) ||
      (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(filters.search.toLowerCase())) ||
      (lead.dealershipName && lead.dealershipName.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewLeadDetails = (lead: WhatsAppLead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  if (loading && leads.length === 0) {
    return (
      <div className={`bg-blanco rounded-2xl shadow-soft p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-blanco rounded-2xl shadow-soft p-8 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error al cargar los leads: {error}</p>
          <button 
            onClick={() => fetchLeads({ page: 1, limit: 20 })}
            className="mt-4 px-4 py-2 bg-wise text-white rounded-2xl hover:bg-wise-profundo transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-blanco rounded-2xl shadow-soft ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-linea">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-tinta">Leads de WhatsApp</h2>
              <p className="text-tinta-2 mt-1">
                Gestiona todos los leads generados desde WhatsApp
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-linea rounded-2xl text-sm focus:ring-2 focus:ring-wise focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Interesado">Interesado</option>
                  <option value="Vendido">Vendido</option>
                  <option value="Perdido">Perdido</option>
                </select>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-wise text-white rounded-2xl hover:bg-wise transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tinta-2/70 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, vehículo o concesionario..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-linea rounded-2xl focus:ring-2 focus:ring-wise focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-papel">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Concesionario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-tinta-2 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-blanco divide-y divide-linea">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-papel">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-tinta">{lead.name}</div>
                      <div className="text-sm text-tinta-2">
                        {lead.username && <span>@{lead.username}</span>}
                        {lead.email && (
                          <span className="ml-2 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="ml-2 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-tinta-2/70" />
                      <div>
                        <div className="text-sm font-medium text-tinta">
                          {lead.vehicleBrand} {lead.vehicleModel}
                        </div>
                        {lead.vehicle && (
                          <div className="text-sm text-tinta-2">
                            {lead.vehicle.year} • {formatPrice(lead.vehicle.price)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-tinta-2/70" />
                      <div>
                        <div className="text-sm font-medium text-tinta">
                          {lead.dealershipName || 'Sin preferencia'}
                        </div>
                        {lead.dealership && (
                          <div className="text-sm text-tinta-2">{lead.dealership.location}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${statusColors[lead.status as keyof typeof statusColors] || 'bg-tarjeta text-tinta'}`}
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Interesado">Interesado</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-tinta">
                      {sourceLabels[lead.source as keyof typeof sourceLabels] || lead.source}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-tinta-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(lead.createdAt)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewLeadDetails(lead)}
                        className="text-wise hover:text-wise-dark transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-tinta-2/70 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-tinta mb-2">No hay leads</h3>
            <p className="text-tinta-2">
              {filters.search || filters.status 
                ? 'No se encontraron leads con los filtros aplicados.'
                : 'Aún no hay leads de WhatsApp registrados.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-blanco rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-linea">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-tinta">Detalles del Lead</h3>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="text-tinta-2/70 hover:text-tinta-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h4 className="text-lg font-semibold text-tinta mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Nombre</label>
                    <p className="text-tinta">{selectedLead.name}</p>
                  </div>
                  {selectedLead.username && (
                    <div>
                      <label className="text-sm font-medium text-tinta-2">Username</label>
                      <p className="text-tinta">@{selectedLead.username}</p>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div>
                      <label className="text-sm font-medium text-tinta-2">Email</label>
                      <p className="text-tinta">{selectedLead.email}</p>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div>
                      <label className="text-sm font-medium text-tinta-2">Teléfono</label>
                      <p className="text-tinta">{selectedLead.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="text-lg font-semibold text-tinta mb-3">Vehículo de Interés</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Marca y Modelo</label>
                    <p className="text-tinta">{selectedLead.vehicleBrand} {selectedLead.vehicleModel}</p>
                  </div>
                  {selectedLead.vehicle && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-tinta-2">Año</label>
                        <p className="text-tinta">{selectedLead.vehicle.year}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-tinta-2">Precio</label>
                        <p className="text-tinta">{formatPrice(selectedLead.vehicle.price)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dealership Info */}
              <div>
                <h4 className="text-lg font-semibold text-tinta mb-3">Concesionario</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Nombre</label>
                    <p className="text-tinta">{selectedLead.dealershipName || 'Sin preferencia'}</p>
                  </div>
                  {selectedLead.dealership && (
                    <div>
                      <label className="text-sm font-medium text-tinta-2">Ubicación</label>
                      <p className="text-tinta">{selectedLead.dealership.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <h4 className="text-lg font-semibold text-tinta mb-3">Mensaje de WhatsApp</h4>
                  <div className="bg-papel rounded-2xl p-4">
                    <p className="text-tinta">{selectedLead.message}</p>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div>
                <h4 className="text-lg font-semibold text-tinta mb-3">Información Adicional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Estado</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedLead.status as keyof typeof statusColors] || 'bg-tarjeta text-tinta'}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Origen</label>
                    <p className="text-tinta">
                      {sourceLabels[selectedLead.source as keyof typeof sourceLabels] || selectedLead.source}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Fecha de Creación</label>
                    <p className="text-tinta">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-tinta-2">Última Actualización</label>
                    <p className="text-tinta">{formatDate(selectedLead.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-linea flex justify-end gap-3">
              <button
                onClick={() => setShowLeadModal(false)}
                className="px-4 py-2 border border-linea text-tinta/80 rounded-2xl hover:bg-papel transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
