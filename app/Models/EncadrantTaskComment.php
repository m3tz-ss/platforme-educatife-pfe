<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EncadrantTaskComment extends Model
{
    protected $table = 'encadrant_task_comments';

    protected $fillable = [
        'encadrant_task_id',
        'user_id',
        'body',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(EncadrantTask::class, 'encadrant_task_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
