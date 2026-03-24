<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EncadrantTask extends Model
{
    protected $table = 'encadrant_tasks';

    protected $fillable = [
        'application_id',
        'encadrant_id',
        'title',
        'description',
        'status',
        'due_date',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
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

    public function taskComments(): HasMany
    {
        return $this->hasMany(EncadrantTaskComment::class, 'encadrant_task_id');
    }
}
