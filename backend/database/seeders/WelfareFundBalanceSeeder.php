<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WelfareFundBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Calculate initial balance from existing transactions
        $totals = DB::table('welfare_fund_transactions')
            ->selectRaw('
                SUM(CASE WHEN type = "inflow" THEN amount ELSE 0 END) as total_inflow,
                SUM(CASE WHEN type = "outflow" THEN amount ELSE 0 END) as total_outflow
            ')
            ->first();

        $initialBalance = ($totals->total_inflow ?? 0) - ($totals->total_outflow ?? 0);

        // Create initial balance record
        DB::table('welfare_fund_balance')->updateOrInsert(
            ['id' => 1],
            [
                'current_balance' => $initialBalance,
                'last_updated' => now(),
                'last_updated_by' => 'System',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }
}