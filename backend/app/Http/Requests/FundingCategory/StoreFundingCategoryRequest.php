<?php

namespace App\Http\Requests\FundingCategory;

use Illuminate\Foundation\Http\FormRequest;

class StoreFundingCategoryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'categoryName' => 'required|string|unique:funding_categories,categoryName',
            'description' => 'required|string',
            'maxAmount' => 'required|numeric|min:0',
            'eligibilityCriteria' => 'required|string',
            'status' => 'required|in:ACTIVE,INACTIVE'
        ];
    }
}