<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'score'          => $this->score,
            'final_decision' => $this->final_decision,
            'notes'          => $this->notes,
            'application_id' => $this->application_id,
            'encadrant_id'   => $this->encadrant_id,
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];
    }
}