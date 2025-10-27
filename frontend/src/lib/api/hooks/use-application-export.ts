import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { applicationsApi, applicationHelpers, ApplicationExportFilters } from '../services/applications';

export const useExportApplications = () => {
  const { toast } = useToast();

  const exportCsvMutation = useMutation({
    mutationFn: async (filters?: ApplicationExportFilters) => {
      return await applicationsApi.exportApplicationsCsv(filters);
    },
    onSuccess: (blob, variables) => {
      const filename = applicationHelpers.generateExportFilename('csv', variables);
      applicationHelpers.downloadBlob(blob, filename);
      
      toast({
        title: "Export Successful",
        description: "Applications have been exported to CSV successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: error?.response?.data?.message || "Failed to export applications to CSV. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async (filters?: ApplicationExportFilters) => {
      return await applicationsApi.exportApplicationsPdf(filters);
    },
    onSuccess: (blob, variables) => {
      const filename = applicationHelpers.generateExportFilename('pdf', variables);
      applicationHelpers.downloadBlob(blob, filename);
      
      toast({
        title: "Export Successful",
        description: "Applications have been exported to PDF successfully.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: error?.response?.data?.message || "Failed to export applications to PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    exportCsv: exportCsvMutation.mutate,
    exportPdf: exportPdfMutation.mutate,
    isExportingCsv: exportCsvMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,
    isExporting: exportCsvMutation.isPending || exportPdfMutation.isPending,
    csvError: exportCsvMutation.error,
    pdfError: exportPdfMutation.error,
  };
};
