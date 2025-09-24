import { useState, useEffect } from 'react';

export interface WhatsAppLead {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  vehicleId?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  dealershipId?: string;
  dealershipName?: string;
  status: string;
  message?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
  };
  dealership?: {
    id: string;
    name: string;
    location: string;
  };
}

export interface CreateLeadData {
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  vehicleId?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  dealershipId?: string;
  dealershipName?: string;
  message?: string;
  source?: string;
}

export interface LeadsResponse {
  leads: WhatsAppLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useWhatsAppLeads() {
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLead = async (leadData: CreateLeadData): Promise<WhatsAppLead | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/whatsapp-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el lead');
      }

      const newLead = await response.json();
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creating WhatsApp lead:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    dealershipId?: string;
  }): Promise<LeadsResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.dealershipId) searchParams.set('dealershipId', params.dealershipId);

      const response = await fetch(`/api/whatsapp-leads?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los leads');
      }

      const data = await response.json();
      setLeads(data.leads);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching WhatsApp leads:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/whatsapp-leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el lead');
      }

      const updatedLead = await response.json();
      setLeads(prev => 
        prev.map(lead => lead.id === leadId ? updatedLead : lead)
      );
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error updating lead status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (leadId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/whatsapp-leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el lead');
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error deleting lead:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportLeads = async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);

      const response = await fetch(`/api/whatsapp-leads/export?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al exportar los leads');
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whatsapp-leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error exporting leads:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    leads,
    loading,
    error,
    createLead,
    fetchLeads,
    updateLeadStatus,
    deleteLead,
    exportLeads,
  };
}
