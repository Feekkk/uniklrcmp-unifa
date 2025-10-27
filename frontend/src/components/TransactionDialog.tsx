import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, DollarSign, Loader2 } from 'lucide-react';
import { CreateTransactionRequest } from '@/lib/api/types/finance';
import { financeHelpers } from '@/lib/api/services/finance';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => Promise<void>;
  isLoading?: boolean;
  currentBalance: number;
}

const TRANSACTION_CATEGORIES = [
  // Inflow categories
  { type: 'inflow', category: 'government_grant', label: 'Government Grant' },
  { type: 'inflow', category: 'donation', label: 'Donation' },
  { type: 'inflow', category: 'fundraising', label: 'Fundraising' },
  { type: 'inflow', category: 'investment_return', label: 'Investment Return' },
  { type: 'inflow', category: 'other_income', label: 'Other Income' },
  
  // Outflow categories
  { type: 'outflow', category: 'student_aid', label: 'Student Aid' },
  { type: 'outflow', category: 'administrative', label: 'Administrative' },
  { type: 'outflow', category: 'operational', label: 'Operational' },
  { type: 'outflow', category: 'maintenance', label: 'Maintenance' },
  { type: 'outflow', category: 'equipment', label: 'Equipment' },
  { type: 'outflow', category: 'other_expense', label: 'Other Expense' }
];

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  currentBalance
}) => {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    type: 'inflow',
    amount: 0,
    category: '',
    description: ''
  });

  const [amountInputValue, setAmountInputValue] = useState<string>('');

  // Handle amount input with validation
  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitizedValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
    
    // Update the input display value
    setAmountInputValue(formattedValue);
    
    // Convert to number for calculation
    const numericValue = formattedValue === '' ? 0 : parseFloat(formattedValue);
    
    // Update the form data with the numeric value
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }));
    
    // Clear amount error
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateTransactionRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTypeChange = (type: 'inflow' | 'outflow') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '' // Reset category when type changes
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (!financeHelpers.validateAmount(formData.amount)) {
      newErrors.amount = 'Amount must be valid and not exceed RM 999,999,999.99';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Format the data before submission
      const submissionData: CreateTransactionRequest = {
        type: formData.type,
        amount: parseFloat(formData.amount.toString()),
        category: formData.category.trim(),
        description: formData.description.trim(),
      };

      // Only add optional fields if they have values
      if (formData.receipt_number?.trim()) {
        submissionData.receipt_number = formData.receipt_number.trim();
      }
      if (formData.remarks?.trim()) {
        submissionData.remarks = formData.remarks.trim();
      }
      if (formData.application_id?.trim()) {
        submissionData.application_id = formData.application_id.trim();
      }
      if (Object.keys(formData.metadata || {}).length > 0) {
        submissionData.metadata = formData.metadata;
      }

      console.log('Submitting transaction:', submissionData);
      await onSubmit(submissionData);
      handleClose();
    } catch (error) {
      console.error('Transaction submission failed:', error);
      // Set validation errors if they're returned from the server
      if (error.response?.data?.data) {
        setErrors(error.response.data.data);
      }
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'inflow',
      amount: 0,
      category: '',
      description: ''
    });
    setAmountInputValue('');
    setErrors({});
    onClose();
  };

  const availableCategories = TRANSACTION_CATEGORIES.filter(cat => cat.type === formData.type);
  const projectedBalance = formData.type === 'inflow' 
    ? currentBalance + (formData.amount || 0)
    : currentBalance - (formData.amount || 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Create New Transaction
          </DialogTitle>
          <DialogDescription>
            Add a new transaction to the welfare fund
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance Display */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-slate-600">Current Balance</p>
                <p className="text-lg font-bold text-slate-900">
                  {financeHelpers.formatCurrency(currentBalance)}
                </p>
              </div>
              {formData.amount > 0 && (
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-600">After Transaction</p>
                  <p className={`text-lg font-bold ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financeHelpers.formatCurrency(projectedBalance)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.type === 'inflow' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('inflow')}
                className="h-10"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Inflow
              </Button>
              <Button
                type="button"
                variant={formData.type === 'outflow' ? 'default' : 'outline'}
                onClick={() => handleTypeChange('outflow')}
                className="h-10"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Outflow
              </Button>
            </div>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (RM) *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              value={amountInputValue}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`h-10 ${errors.amount ? 'border-red-500' : ''}`}
            />
            {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className={`h-10 ${errors.category ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category.category} value={category.category}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this transaction..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`h-16 ${errors.description ? 'border-red-500' : ''}`}
              rows={2}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          {/* Optional Fields Grid */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label htmlFor="receipt_number">Receipt/Invoice Number</Label>
              <Input
                id="receipt_number"
                placeholder="Optional - Enter receipt number"
                value={formData.receipt_number}
                onChange={(e) => handleInputChange('receipt_number', e.target.value)}
                className="h-10"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="application_id">Application ID</Label>
              <Input
                id="application_id"
                placeholder="Optional - Link to student application"
                value={formData.application_id}
                onChange={(e) => handleInputChange('application_id', e.target.value)}
                className="h-10"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional notes or remarks..."
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={2}
                className="h-16"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;