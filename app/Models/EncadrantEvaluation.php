<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EncadrantEvaluation extends Model
{
    protected $table = 'encadrant_evaluations';

    protected $fillable = [
        'application_id',
        'encadrant_id',
        'score',
        'final_decision',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:1',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function encadrant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encadrant_id');
    }
}
