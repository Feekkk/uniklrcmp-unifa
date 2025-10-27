<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->userName(),
            'fullName' => function (array $attributes) {
                return $attributes['name'];
            },
            'email' => fake()->unique()->safeEmail(),
            'program' => fake()->randomElement(['Software Engineering', 'Computer Science', 'Information Technology']),
            'semester' => fake()->numberBetween(1, 8),
            'phoneNo' => fake()->phoneNumber(),
            'icNo' => fake()->unique()->numerify('#############'),
            'address' => fake()->address(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'user',
            'bankName' => fake()->randomElement(['CIMB Bank', 'Maybank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank']),
            'bankAccount' => fake()->numerify('##############'),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
