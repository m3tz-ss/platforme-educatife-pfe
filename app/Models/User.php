<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Application;
use App\Models\Offer;
use App\Models\Enterprise;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'role',
        'manager_id',
        'encadrant_id',
        'enterprise_id',  // ✅ ajouté

        // Champs profil
        'phone',
        'address',
        'bio',
        'photo_path',

        // Étudiant
        'school',
        'field',
        'graduation_year',
        'cv_path',

        // Entreprise
        'position',
        'department',
        'company_name',
        'company_description',
        'company_website',
        'logo_path',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // ================= RELATIONS =================

    // 🎓 Étudiant → ses candidatures
    public function applications()
    {
        return $this->hasMany(Application::class, 'student_id');
    }

    // 🏢 RH → ses offres
    public function offers()
    {
        return $this->hasMany(Offer::class, 'enterprise_id');
    }

    // ✅ Étudiant → son encadrant
    public function encadrant()
    {
        return $this->belongsTo(User::class, 'encadrant_id');
    }

    // ✅ Encadrant → ses stagiaires
    public function stagiaires()
    {
        return $this->hasMany(User::class, 'encadrant_id');
    }

    // ✅ Manager → ses RH et Encadrants
    public function employees()
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    // ✅ RH/Encadrant → son manager
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // ✅ User → son entreprise
    public function enterprise()
    {
        return $this->belongsTo(Enterprise::class, 'enterprise_id');
    }

    // ================= SCOPES =================

    // ✅ Scope : uniquement les encadrants
    public function scopeEncadrants($query)
    {
        return $query->where('role', 'encadrant');
    }

    // ✅ Scope : uniquement les RH
    public function scopeRh($query)
    {
        return $query->where('role', 'rh');
    }

    // ✅ Scope : uniquement les étudiants
    public function scopeStudents($query)
    {
        return $query->where('type', 'student');
    }
      // ✅ Conversations de l'utilisateur
    public function conversations()
{
    return $this->belongsToMany(Conversation::class, 'conversation_participants');
}

}