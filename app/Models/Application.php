<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = ['student_id', 'offer_id', 'status','cv','encadrant_id'];

    public function interviews()
{
    return $this->hasMany(Interview::class);
}

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function offer()
{
    return $this->belongsTo(Offer::class, 'offer_id');
}
    public function encadrant()
    {
        return $this->belongsTo(User::class, 'encadrant_id');
    }

    public function encadrantTasks()
    {
        return $this->hasMany(EncadrantTask::class);
    }

    public function encadrantComments()
    {
        return $this->hasMany(EncadrantComment::class);
    }

    public function encadrantEvaluation()
    {
        return $this->hasOne(EncadrantEvaluation::class);
    }
}
