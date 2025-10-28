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
            'name' => $this->faker->name(),
            'username' => $this->faker->userName(),
            'fullName' => function (array $attributes) {
                return $attributes['name'];
            },
            'email' => $this->faker->unique()->safeEmail(),
            'program' => $this->faker->randomElement(['Software Engineering', 'Computer Science', 'Information Technology']),
            'semester' => $this->faker->numberBetween(1, 8),
            'phoneNo' => $this->faker->phoneNumber(),
            'icNo' => $this->faker->unique()->numerify('#############'),
            'address' => $this->faker->address(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'student',
            'bankName' => $this->faker->randomElement(['CIMB Bank', 'Maybank', 'Public Bank', 'RHB Bank', 'Hong Leong Bank']),
            'bankAccount' => $this->faker->numerify('##############'),
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
