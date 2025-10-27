<?php

namespace App\Http\Controllers\Api;

use App\Models\FundingCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FundingCategoryController extends ApiController
{
    public function index(): JsonResponse
    {
        $categories = FundingCategory::where('status', 'ACTIVE')->get();
        return $this->successResponse($categories, 'Funding categories retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categoryName' => 'required|string|unique:funding_categories,categoryName',
            'description' => 'required|string',
            'maxAmount' => 'required|numeric|min:0',
            'eligibilityCriteria' => 'required|string'
        ]);

        $category = FundingCategory::create([
            'categoryId' => Str::upper(Str::snake($validated['categoryName'])),
            'categoryName' => $validated['categoryName'],
            'description' => $validated['description'],
            'maxAmount' => $validated['maxAmount'],
            'eligibilityCriteria' => $validated['eligibilityCriteria'],
            'status' => 'ACTIVE'
        ]);

        return $this->successResponse($category, 'Funding category created successfully', 201);
    }

    public function show(string $id): JsonResponse
    {
        $category = FundingCategory::findOrFail($id);
        return $this->successResponse($category, 'Funding category retrieved successfully');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = FundingCategory::findOrFail($id);

        $validated = $request->validate([
            'categoryName' => 'string|unique:funding_categories,categoryName,' . $id . ',categoryId',
            'description' => 'string',
            'maxAmount' => 'numeric|min:0',
            'eligibilityCriteria' => 'string',
            'status' => 'in:ACTIVE,INACTIVE'
        ]);

        $category->update($validated);

        return $this->successResponse($category, 'Funding category updated successfully');
    }

    public function destroy(string $id): JsonResponse
    {
        $category = FundingCategory::findOrFail($id);
        $category->status = 'INACTIVE';
        $category->save();

        return $this->successResponse(null, 'Funding category deactivated successfully');
    }
}