<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleProgression extends Model
{
    use HasFactory;

    protected $table = 'module_progressions';

    protected $fillable = [
        'module_id',
        'utilisateur_id',
        'est_fait',
    ];

    protected function casts(): array
    {
        return [
            'est_fait' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(FormationModule::class, 'module_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
