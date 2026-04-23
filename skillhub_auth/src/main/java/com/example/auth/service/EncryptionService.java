package com.example.auth.service;

import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service de chiffrement AES-GCM pour les mots de passe.
 * Utilise une Master Key injectée via variable d'environnement.
 */
@Service
public class EncryptionService {

    private static final String ALGO = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String VERSION = "v1";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final byte[] masterKey;

    public EncryptionService() {
        this(System.getenv("APP_MASTER_KEY"));
    }

    public EncryptionService(String key) {
        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "APP_MASTER_KEY manquante ! L'application ne peut pas démarrer.");
        }
        byte[] keyBytes = key.getBytes();
        this.masterKey = java.util.Arrays.copyOf(keyBytes, 32);
    }

    /**
     * Chiffre un mot de passe avec AES-GCM.
     * @param plaintext le mot de passe en clair
     * @return le mot de passe chiffré au format v1:iv:ciphertext
     */
    public String encrypt(String plaintext) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        SECURE_RANDOM.nextBytes(iv);
        Cipher cipher = Cipher.getInstance(ALGO);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        SecretKeySpec keySpec = new SecretKeySpec(masterKey, "AES");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);
        byte[] ciphertext = cipher.doFinal(plaintext.getBytes());
        String ivB64 = Base64.getEncoder().encodeToString(iv);
        String ctB64 = Base64.getEncoder().encodeToString(ciphertext);
        return VERSION + ":" + ivB64 + ":" + ctB64;
    }

    /**
     * Déchiffre un mot de passe chiffré avec AES-GCM.
     * @param encrypted le mot de passe chiffré
     * @return le mot de passe en clair
     */
    public String decrypt(String encrypted) throws Exception {
        String[] parts = encrypted.split(":");
        byte[] iv = Base64.getDecoder().decode(parts[1]);
        byte[] ciphertext = Base64.getDecoder().decode(parts[2]);
        Cipher cipher = Cipher.getInstance(ALGO);
        GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        SecretKeySpec keySpec = new SecretKeySpec(masterKey, "AES");
        cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);
        byte[] plaintext = cipher.doFinal(ciphertext);
        return new String(plaintext);
    }
}