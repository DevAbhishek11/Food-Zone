<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role gate. Usage: ->middleware('role:admin') or 'role:admin,vendor'.
 * super_admin always passes.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        $role = $user->role?->value;

        if ($role === 'super_admin' || in_array($role, $roles, true)) {
            return $next($request);
        }

        return ApiResponse::error('You do not have permission to perform this action.', 403);
    }
}
