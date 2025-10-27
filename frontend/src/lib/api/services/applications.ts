import axiosInstance from '../axios';

// Application export filters interface
export interface ApplicationExportFilters {
  status?: string;
  month?: number;
  year?: number;
  start_date?: string;
  end_date?: string;
  category?: string;
  export_period?: string;
}

export const applicationsApi = {
  // Export applications to CSV
  exportApplicationsCsv: async (filters?: ApplicationExportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.export_period) params.append('export_period', filters.export_period);

    // Add admin email for authentication
    const adminEmail = localStorage.getItem('admin_email');
    if (adminEmail) {
      params.append('email', adminEmail);
    }

    const response = await axiosInstance.get(`/applications/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export applications to PDF
  exportApplicationsPdf: async (filters?: ApplicationExportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.export_period) params.append('export_period', filters.export_period);

    // Add admin email for authentication
    const adminEmail = localStorage.getItem('admin_email');
    if (adminEmail) {
      params.append('email', adminEmail);
    }

    const response = await axiosInstance.get(`/applications/export-pdf?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};

// Helper functions for application exports
export const applicationHelpers = {
  // Download blob as file
  downloadBlob: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Generate filename for exports
  generateExportFilename: (format: 'csv' | 'pdf', filters?: ApplicationExportFilters): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    let filename = `student_applications_${timestamp}`;
    
    if (filters?.export_period) {
      filename += `_${filters.export_period}`;
    } else if (filters?.year) {
      filename += `_${filters.year}`;
    }
    if (filters?.month) {
      filename += `_${filters.month.toString().padStart(2, '0')}`;
    }
    if (filters?.status) {
      filename += `_${filters.status}`;
    }
    if (filters?.category) {
      filename += `_${filters.category}`;
    }
    if (filters?.start_date && filters?.end_date) {
      filename += `_${filters.start_date}_to_${filters.end_date}`;
    }
    
    return `${filename}.${format}`;
  },

  // Map UI status to API status
  mapStatusToApi: (uiStatus: string): string => {
    switch (uiStatus) {
      case 'committee_approved':
        return 'submitted'; // API uses 'submitted' for committee approved applications
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'all';
    }
  },

  // Get status display name
  getStatusDisplayName: (status: string): string => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'need_receipt':
        return 'Need Receipt';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
};

export default applicationsApi;
