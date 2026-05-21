<?php

namespace App\Enums;

enum PostPrivacy: string
{
    case Public = 'public';
    case Followers = 'followers';
    case Private = 'private';

    /** @return string[] */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
