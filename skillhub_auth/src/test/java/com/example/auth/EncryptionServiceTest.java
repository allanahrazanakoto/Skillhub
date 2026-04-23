package com.example.auth;

import com.example.auth.service.EncryptionService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test vérifiant que l'application refuse de démarrer
 * si la Master Key est absente.
 */
class EncryptionServiceTest {

    @Test
    void demarrageSansMasterKeyEchoue() {
        // On essaie de créer le service avec une clé VIDE
        // Le service DOIT refuser et lancer une erreur
        // Si il refuse bien → le test RÉUSSIT
        // Si il ne refuse pas → le test ÉCHOUE  (problème de sécurité !)
        assertThrows(IllegalStateException.class, () -> {
            new EncryptionService("");
        });
    }

    @Test
    void demarrageSansMasterKeyNullEchoue() {
        // Même chose mais avec null au lieu de vide
        assertThrows(IllegalStateException.class, () -> {
            new EncryptionService(null);
        });
    }
}