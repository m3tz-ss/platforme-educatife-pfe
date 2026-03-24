<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EncadrantComment extends Model
{
    protected $table = 'encadrant_comments';

    protected $fillable = [
        'application_id',
        'encadrant_id',
        'body',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function encadrant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encadrant_id');
    }
}
