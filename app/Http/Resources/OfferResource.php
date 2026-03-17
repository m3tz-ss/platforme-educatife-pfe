<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\User;

class OfferResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        $offer = $this;
        $user  = $offer->user;

        if (!$user) {
            $companyName = $companyEmail = $companyPhone = $companyDesc = $companyWebsite = null;
        } elseif ($user->role === 'manager') {
            $companyName    = $user->company_name;
            $companyEmail   = $user->email;
            $companyPhone   = $user->phone;
            $companyDesc    = $user->company_description;
            $companyWebsite = $user->company_website;
        } elseif (in_array($user->role, ['rh', 'encadrant'])) {
            $manager        = User::find($user->manager_id);
            $companyName    = $user->company_name    ?? $manager?->company_name;
            $companyEmail   = $manager?->email       ?? $user->email;
            $companyPhone   = $manager?->phone       ?? $user->phone;
            $companyDesc    = $manager?->company_description;
            $companyWebsite = $manager?->company_website;
        } else {
            $companyName    = $user->company_name ?? $user->name;
            $companyEmail   = $user->email;
            $companyPhone   = $user->phone;
            $companyDesc    = $user->company_description;
            $companyWebsite = $user->company_website;
        }

        return [
            'id'               => $offer->id,
            'title'            => $offer->title,
            'domain'           => $offer->domain,
            'location'         => $offer->location,
            'duration'         => $offer->duration,
            'start_date'       => $offer->start_date,
            'available_places' => $offer->available_places,
            'description'      => $offer->description,
            'requirements'     => $offer->requirements,
            'advantages'       => $offer->advantages,
            'created_at'       => $offer->created_at,
            'enterprise' => [
                'name'                => $companyName    ?? 'N/A',
                'company_name'        => $companyName    ?? 'N/A',
                'email'               => $companyEmail   ?? 'N/A',
                'phone'               => $companyPhone   ?? 'N/A',
                'company_description' => $companyDesc    ?? 'N/A',
                'company_website'     => $companyWebsite ?? 'N/A',
            ],
        ];
    }
}

