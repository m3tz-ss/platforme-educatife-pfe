<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = ['user_id', 'contact_user_id'];

    public function contactUser()
    {
        return $this->belongsTo(User::class, 'contact_user_id');
    }
}
