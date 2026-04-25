<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'sender_id', 'body', 'read_at', 
        'attachment', 'attachment_name', 'is_edited', 'is_deleted'
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'is_edited' => 'boolean',
        'is_deleted' => 'boolean',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}