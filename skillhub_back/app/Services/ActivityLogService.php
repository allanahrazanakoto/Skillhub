<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use MongoDB\Client;

/**
 * Enregistre les événements importants pour l'historisation (CDC : MongoDB activity_logs).
 * Si MONGODB_URI est configuré, écrit dans la collection MongoDB.
 * Par défaut, écrit dans le log Laravel au format structuré.
 */
class ActivityLogService
{
    public function logCourseEnrollment(int $userId, int $courseId): void
    {
        $this->log([
            'event' => 'course_enrollment',
            'user_id' => $userId,
            'course_id' => $courseId,
            'timestamp' => \now()->toIso8601String(),
        ]);
    }

    public function logCourseCreation(int $courseId, int $createdBy): void
    {
        $this->log([
            'event' => 'course_creation',
            'course_id' => $courseId,
            'created_by' => $createdBy,
            'timestamp' => \now()->toIso8601String(),
        ]);
    }

    public function logCourseUpdate(int $courseId, int $updatedBy, array $oldValues, array $newValues): void
    {
        $this->log([
            'event' => 'course_update',
            'course_id' => $courseId,
            'updated_by' => $updatedBy,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'timestamp' => \now()->toIso8601String(),
        ]);
    }

    public function logCourseDeletion(int $courseId, int $deletedBy): void
    {
        $this->log([
            'event' => 'course_deletion',
            'course_id' => $courseId,
            'deleted_by' => $deletedBy,
            'timestamp' => \now()->toIso8601String(),
        ]);
    }

    private function log(array $payload): void
    {
        $uri = \env('MONGODB_URI');
        $database = \env('MONGODB_DB', 'skillhub_activity_log');
        $collection = \env('MONGODB_COLLECTION', 'activity_logs');

        if ($uri) {
            try {
                $client = new Client($uri);
                $client->{$database}->{$collection}->insertOne($payload);
                return;
            } catch (\Throwable $exception) {
                Log::channel('single')->error('mongodb_activity_log_failed', [
                    'message' => $exception->getMessage(),
                    'payload' => $payload,
                ]);
            }
        }

        Log::channel('single')->info('activity_log', $payload);
    }
}
