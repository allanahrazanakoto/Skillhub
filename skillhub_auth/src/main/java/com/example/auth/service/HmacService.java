package com.example.auth.service;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

/**
 * Service de calcul HMAC pour l'authentification TP3.
 * Le mot de passe ne circule plus sur le réseau.
 */
@Service
public class HmacService {

    private static final String HMAC_ALGO = "HmacSHA256";

    /**
     * Calcule le HMAC-SHA256 d'un message avec une clé.
     * @param key la clé secrète (mot de passe)
     * @param message le message à signer
     * @return le HMAC en hexadécimal
     */
    public String compute(String key, String message) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGO); // . on prend l'outil de calcul HMAC
        SecretKeySpec secretKey = new SecretKeySpec(
                key.getBytes(), HMAC_ALGO); // . on prépare le mot de passe comme clé secrète
        mac.init(secretKey); // . on initialise l'outil avec la clé
        byte[] hmacBytes = mac.doFinal(message.getBytes()); // . on calcule l'empreinte
        return HexFormat.of().formatHex(hmacBytes);  // . on convertit en texte lisible
    }

    /**
     * Compare deux HMAC en temps constant pour éviter les timing attacks.
     * @param a premier HMAC
     * @param b deuxième HMAC
     * @return true si égaux
     */

    public boolean compareConstantTime(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i); // compare TOUS les caractères sans jamais s'arrête
        }
        return result == 0;
    }
}