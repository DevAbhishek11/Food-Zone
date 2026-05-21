<?php

namespace App\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Pending = 'pending';
    case Suspended = 'suspended';
    case Banned = 'banned';
    case Deactivated = 'deactivated';

    /** Whether the account is allowed to authenticate / act on the platform. */
    public function canAccess(): bool
    {
        return in_array($this, [self::Active, self::Pending], true);
    }

    /** @return string[] */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
