<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FinancialAidApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            // Personal Information (always required)
            'fullName' => 'required|string|max:255',
            'studentId' => 'required|string|max:50',
            'course' => 'required|string|max:100',
            'semester' => 'nullable|string|max:20',
            'contactNumber' => 'nullable|string|max:20',
            'emergencyContact' => 'nullable|string|max:20',
            
            // Category Selection
            'categoryId' => 'required|string|in:CAT-BEREAVEMENT,CAT-ILLNESS-OUTPATIENT,CAT-ILLNESS-INPATIENT,CAT-ILLNESS-CHRONIC,CAT-EMERGENCY-NATURAL,CAT-EMERGENCY-FAMILY,CAT-EMERGENCY-OTHERS',
        ];

        // Add category-specific validation rules
        $categoryId = $this->input('categoryId');
        if ($categoryId === 'CAT-BEREAVEMENT') {
            $rules = array_merge($rules, $this->getBereavementRules());
        } elseif (in_array($categoryId, ['CAT-ILLNESS-OUTPATIENT', 'CAT-ILLNESS-INPATIENT', 'CAT-ILLNESS-CHRONIC'])) {
            $rules = array_merge($rules, $this->getIllnessInjuriesRules($categoryId));
        } elseif (in_array($categoryId, ['CAT-EMERGENCY-NATURAL', 'CAT-EMERGENCY-FAMILY', 'CAT-EMERGENCY-OTHERS'])) {
            $rules = array_merge($rules, $this->getEmergencyRules($categoryId));
        }

        return $rules;
    }

    /**
     * Get validation rules for bereavement category
     */
    private function getBereavementRules(): array
    {
        return [
            'bereavementType' => 'required|string|in:student,parent,sibling',
            'deathCertificate' => 'nullable|array',
            'deathCertificate.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120', 
        ];
    }

    /**
     * Get validation rules for illness-injuries category
     */
    private function getIllnessInjuriesRules(string $categoryId): array
    {
        $rules = [];

        if ($categoryId === 'CAT-ILLNESS-OUTPATIENT') {
            $rules = array_merge($rules, [
                'clinicName' => 'required|string|max:255',
                'reasonVisit' => 'required|string|max:1000',
                'visitDateTime' => 'required|date',
                'totalAmountOutpatient' => 'required|numeric|min:0|max:30', 
                'receiptClinic' => 'required|array',
                'receiptClinic.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        } elseif ($categoryId === 'CAT-ILLNESS-INPATIENT') {
            $rules = array_merge($rules, [
                'reasonVisitInpatient' => 'required|string|max:1000',
                'checkInDate' => 'required|date',
                'checkOutDate' => 'required|date|after:checkInDate',
                'totalAmountInpatient' => 'required|numeric|min:0|max:10000', 
                'hospitalDocuments' => 'required|array',
                'hospitalDocuments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        } elseif ($categoryId === 'CAT-ILLNESS-CHRONIC') {
            $rules = array_merge($rules, [
                'totalAmountInjuries' => 'required|numeric|min:0|max:200',
                'injuryDocuments' => 'required|array',
                'injuryDocuments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        }

        return $rules;
    }

    /**
     * Get validation rules for emergency category
     */
    private function getEmergencyRules(string $categoryId): array
    {
        $rules = [];

        if ($categoryId === 'CAT-EMERGENCY-NATURAL') {
            $rules = array_merge($rules, [
                'totalAmountCriticalIllness' => 'required|numeric|min:0|max:200', 
                'criticalIllnessDocuments' => 'required|array',
                'criticalIllnessDocuments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        } elseif ($categoryId === 'CAT-EMERGENCY-FAMILY') {
            $rules = array_merge($rules, [
                'naturalDisasterCase' => 'required|string|max:1000',
                'totalAmountNaturalDisaster' => 'required|numeric|min:0|max:200', 
                'naturalDisasterDocuments' => 'required|array',
                'naturalDisasterDocuments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        } elseif ($categoryId === 'CAT-EMERGENCY-OTHERS') {
            $rules = array_merge($rules, [
                'othersCase' => 'required|string|max:1000',
                'totalAmountOthers' => 'required|numeric|min:0',
                'othersDocuments' => 'required|array',
                'othersDocuments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'fullName.required' => 'Full name is required.',
            'studentId.required' => 'Student ID is required.',
            'course.required' => 'Course/Program is required.',
            'categoryId.required' => 'Please select a fund category.',
            'categoryId.in' => 'Invalid fund category selected.',
            'bereavementType.required' => 'Please select relationship to deceased.',
            'bereavementType.in' => 'Invalid bereavement type selected.',
            'deathCertificate.required' => 'Death certificate(s) are required.',
            'deathCertificate.array' => 'Death certificate must be an array of files.',
            'deathCertificate.*.mimes' => 'Death certificate must be a PDF, JPG, or PNG file.',
            'deathCertificate.*.max' => 'Death certificate file size must not exceed 5MB.',
            'clinicName.required' => 'Clinic name is required for outpatient treatment.',
            'reasonVisit.required' => 'Reason for visit is required.',
            'visitDateTime.required' => 'Visit date and time is required.',
            'totalAmountOutpatient.required' => 'Total amount is required.',
            'totalAmountOutpatient.max' => 'Outpatient treatment limit is RM 30 per semester.',
            'receiptClinic.required' => 'Clinic receipt(s) are required.',
            'receiptClinic.array' => 'Clinic receipt must be an array of files.',
            'receiptClinic.*.mimes' => 'Clinic receipt must be a PDF, JPG, or PNG file.',
            'receiptClinic.*.max' => 'Clinic receipt file size must not exceed 5MB.',
            'reasonVisitInpatient.required' => 'Reason for hospitalization is required.',
            'checkInDate.required' => 'Check-in date is required.',
            'checkOutDate.required' => 'Check-out date is required.',
            'checkOutDate.after' => 'Check-out date must be after check-in date.',
            'totalAmountInpatient.required' => 'Total amount is required.',
            'totalAmountInpatient.max' => 'Inpatient treatment limit is RM 10,000.',
            'hospitalDocuments.required' => 'Hospital documents are required.',
            'hospitalDocuments.array' => 'Hospital documents must be an array of files.',
            'hospitalDocuments.*.mimes' => 'Hospital documents must be PDF, JPG, or PNG files.',
            'hospitalDocuments.*.max' => 'Hospital document file size must not exceed 5MB.',
            'totalAmountInjuries.required' => 'Total amount is required.',
            'totalAmountInjuries.max' => 'Injuries support equipment limit is RM 200.',
            'injuryDocuments.required' => 'Supporting documents are required.',
            'injuryDocuments.array' => 'Injury documents must be an array of files.',
            'injuryDocuments.*.mimes' => 'Injury documents must be PDF, JPG, or PNG files.',
            'injuryDocuments.*.max' => 'Injury document file size must not exceed 5MB.',
            'totalAmountCriticalIllness.required' => 'Total amount is required.',
            'totalAmountCriticalIllness.max' => 'Critical illness limit is RM 200.',
            'criticalIllnessDocuments.required' => 'Supporting document(s) are required.',
            'criticalIllnessDocuments.array' => 'Critical illness documents must be an array of files.',
            'criticalIllnessDocuments.*.mimes' => 'Critical illness documents must be PDF, JPG, or PNG files.',
            'criticalIllnessDocuments.*.max' => 'Critical illness document file size must not exceed 5MB.',
            'naturalDisasterCase.required' => 'Case description is required.',
            'totalAmountNaturalDisaster.required' => 'Total amount is required.',
            'totalAmountNaturalDisaster.max' => 'Natural disaster limit is RM 200.',
            'naturalDisasterDocuments.required' => 'Supporting documents are required.',
            'naturalDisasterDocuments.array' => 'Natural disaster documents must be an array of files.',
            'naturalDisasterDocuments.*.mimes' => 'Natural disaster documents must be PDF, JPG, or PNG files.',
            'naturalDisasterDocuments.*.max' => 'Natural disaster document file size must not exceed 5MB.',
            'othersCase.required' => 'Case description is required.',
            'totalAmountOthers.required' => 'Total amount is required.',
            'othersDocuments.required' => 'Supporting documents are required.',
            'othersDocuments.array' => 'Others documents must be an array of files.',
            'othersDocuments.*.mimes' => 'Others documents must be PDF, JPG, or PNG files.',
            'othersDocuments.*.max' => 'Others document file size must not exceed 5MB.',
        ];
    }
}
