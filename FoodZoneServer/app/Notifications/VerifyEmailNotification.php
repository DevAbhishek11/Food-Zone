<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $token) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $url = $frontend.'/verify-email?token='.$this->token.'&email='.urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Verify your FoodZone email')
            ->greeting('Welcome to FoodZone, '.$notifiable->name.'!')
            ->line('Please confirm your email address to activate your account.')
            ->action('Verify Email', $url)
            ->line('This link expires in 24 hours. If you did not create an account, no action is required.');
    }
}
