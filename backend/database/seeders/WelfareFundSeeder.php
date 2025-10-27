<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WelfareFundTransaction;
use Carbon\Carbon;

class WelfareFundSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create initial welfare fund balance
        $initialTransactions = [
            [
                'type' => 'inflow',
                'amount' => 500000.00, // RM 500,000 initial fund
                'category' => 'government_grant',
                'description' => 'Initial government grant for welfare fund',
                'receipt_number' => 'GRANT-2024-001',
                'processed_by' => null, // System initialization
                'application_id' => null,
                'balance_after' => 500000.00,
                'remarks' => 'Initial setup of welfare fund from government grant',
                'metadata' => [
                    'source' => 'Ministry of Education',
                    'grant_type' => 'annual_allocation',
                    'approved_by' => 'System'
                ],
                'created_at' => Carbon::now()->subMonths(6),
                'updated_at' => Carbon::now()->subMonths(6)
            ],
        ];

        // Generate transaction IDs and insert
        foreach ($initialTransactions as $index => $transaction) {
            $transaction['transactionId'] = 'TXN-' . date('Ymd', strtotime($transaction['created_at'])) . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
            WelfareFundTransaction::create($transaction);
        }

        $this->command->info('Welfare fund transactions seeded successfully!');
        $this->command->info('Current balance: RM ' . number_format(WelfareFundTransaction::getCurrentBalance(), 2));
    }
}
