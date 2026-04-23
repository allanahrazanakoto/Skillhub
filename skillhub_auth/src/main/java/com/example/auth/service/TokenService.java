package com.example.auth.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service de gestion des tokens SSO.
 */
@Service
public class TokenService {

    private final Map<String, String> tokens = new ConcurrentHashMap<>(); //
    private final Map<String, LocalDateTime> expiry = new ConcurrentHashMap<>();

    /**
     * Génère un token SSO pour un utilisateur.
     * @param email l'email de l'utilisateur
     * @return le token généré
     */
    public String generateToken(String email) { // creer un token unique
                                  //  une fonction Java qui génère automatiquement un identifiant unique et aléatoire
        String token = "token-" + UUID.randomUUID(); // genere un id unique
        tokens.put(token, email);
        expiry.put(token, LocalDateTime.now().plusMinutes(15));
        return token;
    }

    /**
     * Vérifie si un token est valide et non expiré.
     * @param token le token à vérifier
     * @return true si valide
     */
    public boolean isValid(String token) { // verifie si le token est encore valide
        if (token == null || !tokens.containsKey(token)) return false;
        LocalDateTime exp = expiry.get(token); // recupere la date d'expiration
        return exp != null && exp.isAfter(LocalDateTime.now()); // si axces pas refuse on accepte
    }

    /**
     * Retourne l'email associé à un token.
     * @param token le token
     * @return l'email
     */
    public String getEmail(String token) {
        return tokens.get(token);
    } // retourne qui est l'utilisateur qui se connecte
}