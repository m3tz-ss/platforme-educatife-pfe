<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\EvaluationResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'student_id'       => $this->student_id,
            'offer_id'         => $this->offer_id,
            'status'           => $this->status,
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
            'student'          => new UserResource($this->whenLoaded('student')),
            'offer'            => new OfferResource($this->whenLoaded('offer')),
            'encadrant'        => new UserResource($this->whenLoaded('encadrant')),
            'evaluations'      => EvaluationResource::collection($this->whenLoaded('evaluations')),
        ];
    }
}
