<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About RCMP Financial Aids Backend

RCMP Financial Aids Backend is a Laravel-based backend system designed to handle financial operations for UniKL. It leverages modern PHP libraries and tools to provide a robust and scalable solution.

---

## Libraries and Technologies Used

### Core Framework
- **[Laravel Framework](https://laravel.com/)** (v12.0): A PHP framework for building web applications with expressive and elegant syntax.

### Libraries
- **[Tymon JWT-Auth](https://github.com/tymondesigns/jwt-auth)**: For implementing JSON Web Token (JWT) authentication.
- **[Intervention Image](https://image.intervention.io/)**: For image manipulation and processing.
- **[Maatwebsite Excel](https://docs.laravel-excel.com/)**: For handling Excel file imports and exports.

### Development Tools
- **[Laravel Tinker](https://github.com/laravel/tinker)**: A REPL for interacting with the application.
- **[Laravel Pint](https://laravel.com/docs/pint)**: A code style fixer for maintaining consistent code formatting.
- **[Laravel Sail](https://laravel.com/docs/sail)**: A lightweight command-line interface for running Laravel projects in Docker.
- **[Laravel Telescope](https://laravel.com/docs/telescope)**: A debugging assistant for Laravel applications.
- **[Mockery](https://github.com/mockery/mockery)**: A mock object framework for unit testing.
- **[PHPUnit](https://phpunit.de/)**: A testing framework for PHP.

### Additional Tools
- **[FakerPHP](https://fakerphp.github.io/)**: For generating fake data during development and testing.
- **[Concurrently](https://www.npmjs.com/package/concurrently)**: For running multiple commands concurrently during development.

---

## Features

- **Authentication**: JWT-based authentication for secure API access.
- **Image Processing**: Resize, crop, and manipulate images using Intervention Image.
- **Excel Integration**: Import and export data in Excel format.
- **Queue Management**: Background job processing using Laravel's queue system.
- **Database Migrations**: Schema management with Laravel's migration system.
- **Testing**: Unit and feature testing with PHPUnit and Mockery.

---