- Inertia & React (this project) version: **[github.com/nunomaduro/laravel-starter-kit-inertia-react](https://github.com/nunomaduro/laravel-starter-kit-inertia-react)**
- Blade version: **[github.com/nunomaduro/laravel-starter-kit](https://github.com/nunomaduro/laravel-starter-kit)**
- Inertia & Vue version: **[github.com/nunomaduro/laravel-starter-kit-inertia-vue](https://github.com/nunomaduro/laravel-starter-kit-inertia-vue)**

<p align="center">
    <a href="https://youtu.be/VhzP0XWGTC4" target="_blank">
        <img src="https://github.com/nunomaduro/laravel-starter-kit/blob/main/art/banner.png" alt="Overview Laravel Starter Kit" style="width:70%;">
    </a>
</p>

<p>
    <a href="https://github.com/nunomaduro/laravel-starter-kit-inertia-react/actions"><img src="https://github.com/nunomaduro/laravel-starter-kit-inertia-react/actions/workflows/tests.yml/badge.svg" alt="Build Status"></a>
    <a href="https://packagist.org/packages/nunomaduro/laravel-starter-kit-inertia-react"><img src="https://img.shields.io/packagist/dt/nunomaduro/laravel-starter-kit-inertia-react" alt="Total Downloads"></a>
    <a href="https://packagist.org/packages/nunomaduro/laravel-starter-kit-inertia-react"><img src="https://img.shields.io/packagist/v/nunomaduro/laravel-starter-kit-inertia-react" alt="Latest Stable Version"></a>
    <a href="https://packagist.org/packages/nunomaduro/laravel-starter-kit-inertia-react"><img src="https://img.shields.io/packagist/l/nunomaduro/laravel-starter-kit-inertia-react" alt="License"></a>
</p>

**Laravel Starter Kit (Inertia & React)** is an ultra-strict, type-safe [Laravel](https://laravel.com) skeleton engineered for developers who refuse to compromise on code quality. This opinionated starter kit enforces rigorous development standards through meticulous tooling configuration and architectural decisions that prioritize type safety, immutability, and fail-fast principles.

## Why This Starter Kit?

Modern PHP has evolved into a mature, type-safe language, yet many Laravel projects still operate with loose conventions and optional typing. This starter kit changes that paradigm by enforcing:

- **Fully Actions-Oriented Architecture**: Every operation is encapsulated in a single-action class
- **Cruddy by Design**: Standardized CRUD operations for all controllers, actions, and Inertia & React pages
- **100% Type Coverage**: Every method, property, and parameter is explicitly typed
- **Zero Tolerance for Code Smells**: Rector, PHPStan, OxLint, and Oxfmt at maximum strictness catch issues before they become bugs
- **Immutable-First Architecture**: Data structures favor immutability to prevent unexpected mutations
- **Fail-Fast Philosophy**: Errors are caught at compile-time, not runtime
- **Automated Code Quality**: Pre-configured tools ensure consistent, pristine code across your entire team
- **Just Better Laravel Defaults**: Thanks to **[Essentials](https://github.com/nunomaduro/essentials)** / strict models, auto eager loading, immutable dates, and more...
- **AI Guidelines**: Integrated AI Guidelines to assist in maintaining code quality and consistency
- **Full Testing Suite**: More than 150 tests with 100% code coverage using Pest

This isn't just another Laravel boilerplate—it's a statement that PHP applications can and should be built with the same rigor as strongly-typed languages like Rust or TypeScript.

## Getting Started

> **Requires [Docker](https://docs.docker.com/get-docker/)** for [Laravel Sail](https://laravel.com/docs/sail). The application runs in containers; use `./vendor/bin/sail` (or a shell alias to `sail`) so Composer, Artisan, and Bun run inside the `laravel.test` service.

> **Testing with coverage** expects a coverage driver such as [Xdebug](https://xdebug.org/docs/install). Sail sets `XDEBUG_MODE` via environment variables; see `compose.yaml` and Sail documentation.

Create your type-safe Laravel application using [Composer](https://getcomposer.org):

```bash
composer create-project nunomaduro/laravel-starter-kit-inertia-react --prefer-dist example-app
```

### Initial Setup

Navigate to your project, start Sail, then run setup and dev commands **through Sail**:

```bash
cd example-app

# Start containers (builds the image on first run)
./vendor/bin/sail up -d

# Install PHP deps, env, migrations, frontend deps, and production asset build
./vendor/bin/sail composer setup

# Start Laravel, queue, logs, and Vite concurrently
./vendor/bin/sail composer dev
```

### Optional: Browser Testing Setup

Pest browser tests use Playwright. The `playwright` package is already a dev dependency; download the browser binaries **inside Sail** so they match the container’s Linux environment:

```bash
./vendor/bin/sail bunx playwright install
```

To install only Chromium (smaller download):

```bash
./vendor/bin/sail bunx playwright install chromium
```

### Verify Installation

Run the test suite to ensure everything is configured correctly:

```bash
./vendor/bin/sail composer test
```

You should see 100% test coverage and all quality checks passing.

## Available Tooling

All `composer` and `bun` workflows below are intended to run **via Sail** (prefix with `./vendor/bin/sail`).

### Development
- `./vendor/bin/sail composer dev` - Starts Laravel server, queue worker, log monitoring, and Vite+ dev server concurrently

### Code Quality
- `./vendor/bin/sail composer lint` - Runs Rector (refactoring), Pint (PHP formatting), and Oxfmt (JS/TS formatting)
- `./vendor/bin/sail composer test:lint` - Dry-run mode for CI/CD pipelines

### Testing
- `./vendor/bin/sail composer test:type-coverage` - Ensures 100% type coverage with Pest
- `./vendor/bin/sail composer test:types` - Runs PHPStan at level 9 (maximum strictness)
- `./vendor/bin/sail composer test:unit` - Runs Pest tests with 100% code coverage requirement
- `./vendor/bin/sail composer test` - Runs the complete test suite (type coverage, unit tests, linting, static analysis)

### Maintenance
- `./vendor/bin/sail composer update:requirements` - Updates all PHP and Bun dependencies to latest versions

## License

**Laravel Starter Kit Inertia React** was created by **[Nuno Maduro](https://x.com/enunomaduro)** under the **[MIT license](https://opensource.org/licenses/MIT)**.
