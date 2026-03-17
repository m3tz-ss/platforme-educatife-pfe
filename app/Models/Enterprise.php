<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enterprise extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'description',
        'manager_id',
    ];

    // ✅ Le manager de l'entreprise
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // ✅ Tous les employés (RH + Encadrants)
    public function employees()
    {
        return $this->hasMany(User::class, 'enterprise_id');
    }

    // ✅ Uniquement les RH
    public function rh()
    {
        return $this->hasMany(User::class, 'enterprise_id')->where('role', 'rh');
    }

    // ✅ Uniquement les Encadrants
    public function encadrants()
    {
        return $this->hasMany(User::class, 'enterprise_id')->where('role', 'encadrant');
    }

    // ✅ Les offres de stage de l'entreprise
    public function offers()
    {
        return $this->hasMany(Offer::class, 'enterprise_id');
    }
     public function users()
    {
        return $this->hasMany(User::class, 'enterprise_id'); 
        // 'enterprise_id' est la clé étrangère dans la table users
    }
}