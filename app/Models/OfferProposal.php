<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferProposal extends Model
{
    protected $fillable = [
        'offer_id',
        'student_id',
        'rh_id',
        'personal_message',
        'status', // pending | accepted | refused
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function rh()
    {
        return $this->belongsTo(User::class, 'rh_id');
    }
}
