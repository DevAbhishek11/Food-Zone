<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\OptionalSanctum;
use App\Http\Middleware\SecurityHeaders;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
            'active' => EnsureActiveUser::class,
            'auth.optional' => OptionalSanctum::class,
        ]);

        // Hardening headers on every API response.
        $middleware->api(append: [SecurityHeaders::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render all API (and JSON) exceptions in the standard envelope.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null; // fall back to default web rendering
            }

            return match (true) {
                $e instanceof ApiException => ApiResponse::error($e->getMessage(), $e->statusCode(), $e->errors()),

                $e instanceof ValidationException => ApiResponse::error(
                    'The given data was invalid.', 422, $e->errors()
                ),

                $e instanceof AuthenticationException => ApiResponse::error('Unauthenticated.', 401),

                $e instanceof AuthorizationException => ApiResponse::error(
                    $e->getMessage() ?: 'This action is unauthorized.', 403
                ),

                $e instanceof ModelNotFoundException,
                $e instanceof NotFoundHttpException => ApiResponse::error('Resource not found.', 404),

                $e instanceof TooManyRequestsHttpException => ApiResponse::error(
                    'Too many requests. Please slow down.', 429
                ),

                $e instanceof HttpExceptionInterface => ApiResponse::error(
                    $e->getMessage() ?: 'Request failed.', $e->getStatusCode()
                ),

                default => ApiResponse::error(
                    config('app.debug') ? $e->getMessage() : 'Something went wrong on our end.',
                    500
                ),
            };
        });
    })->create();
