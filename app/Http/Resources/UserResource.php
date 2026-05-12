<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (!$this->resource) return null;
        
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'email'        => $this->email,
            'role'         => $this->role,
            'school'       => $this->school,
            'cv_path'      => $this->cv_path,
            'company_name' => $this->company_name,
        ];
    }
}
