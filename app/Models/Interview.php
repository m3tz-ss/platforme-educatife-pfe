<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    protected $fillable = [
        'application_id',
        'date',
        'time',
        'location',
        'meeting_link',
        'status',
        'result',
        'comment'
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
