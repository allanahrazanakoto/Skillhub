<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormationModule extends Model
{
    use HasFactory;

    protected $table = 'modules';

    protected $fillable = [
        'formation_id',
        'titre',
        'contenu',
        'ordre',
    ];

    public function formation(): BelongsTo
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }
}
