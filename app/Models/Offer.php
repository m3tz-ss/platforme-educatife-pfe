<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'enterprise_id', // ✅ pas user_id
        'title',
        'domain',
        'location',
        'duration',
        'start_date',
        'available_places',
        'description',
        'requirements',
        'advantages',
    ];

    // ✅ Relation correcte — enterprise_id pointe vers users
    public function user()
    {
        return $this->belongsTo(User::class, 'enterprise_id'); // ✅ clé étrangère correcte
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'offer_id');
    }
    public function enterprise()
{
    return $this->belongsTo(User::class, 'enterprise_id');
}

}