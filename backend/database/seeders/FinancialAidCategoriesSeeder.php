<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FundingCategory;

class FinancialAidCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'categoryId' => 'CAT-BEREAVEMENT',
                'categoryName' => 'Bereavement (Khairat)',
                'description' => 'Financial assistance for bereavement expenses',
                'maxAmount' => 500.00,
                'eligibilityCriteria' => 'Student, Parent, or Sibling bereavement',
                'status' => 'active'
            ],
            [
                'categoryId' => 'CAT-ILLNESS',
                'categoryName' => 'Illness & Injuries',
                'description' => 'Financial assistance for medical expenses and injuries',
                'maxAmount' => 1000.00,
                'eligibilityCriteria' => 'Outpatient, Inpatient, or Injury support',
                'status' => 'active'
            ],
            [
                'categoryId' => 'CAT-EMERGENCY',
                'categoryName' => 'Emergency',
                'description' => 'Financial assistance for emergency situations',
                'maxAmount' => 200.00,
                'eligibilityCriteria' => 'Critical illness, Natural disaster, or Other emergencies',
                'status' => 'active'
            ]
        ];

        foreach ($categories as $category) {
            FundingCategory::updateOrCreate(
                ['categoryId' => $category['categoryId']],
                $category
            );
        }
    }
}
