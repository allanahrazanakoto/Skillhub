package com.example.auth.service;

import com.example.auth.entity.AuthNonce;
import com.example.auth.entity.User;
import com.example.auth.exception.AuthenticationFailedException;
import com.example.auth.exception.InvalidInputException;
import com.example.auth.exception.ResourceConflictException;
import com.example.auth.repository.AuthNonceRepository;
import com.example.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;


@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_ATTEMPTS = 5; // 5 essais maximum
    private static final int LOCK_MINUTES = 2; // bloque deux minutes
    private static final int TIMESTAMP_WINDOW = 60; // requete valide 60s

    private final UserRepository userRepository;
    private final AuthNonceRepository nonceRepository;
    private final EncryptionService encryptionService;
    private final HmacService hmacService;

    public AuthService(UserRepository userRepository,
                       AuthNonceRepository nonceRepository,
                       EncryptionService encryptionService,
                       HmacService hmacService) {
        this.userRepository = userRepository;
        this.nonceRepository = nonceRepository;
        this.encryptionService = encryptionService;
        this.hmacService = hmacService;
    }

    /**
     * Inscrit un nouvel utilisateur.
     */
    public User register(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new InvalidInputException("Email invalide");
        }
        if (!isPasswordValid(password)) {
            throw new InvalidInputException("Mot de passe invalide");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            logger.warn("Inscription échouée : email déjà existant");
            throw new ResourceConflictException("Email déjà existant");
        }
        try {
            String encrypted = encryptionService.encrypt(password);
            User user = new User(email, encrypted);
            logger.info("Inscription réussie");
            return userRepository.save(user);
        } catch (Exception e) {
            throw new InvalidInputException("Erreur lors du chiffrement");
        }
    }

    /**
     * Authentifie un utilisateur avec HMAC + nonce + timestamp.
     */
    public String login(String email, String nonce, long timestamp, String hmac) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            logger.warn("Login échoué");
            throw new AuthenticationFailedException("Accès refusé");
        }

        // Vérifier blocage
        if (user.getLockUntil() != null && user.getLockUntil().isAfter(LocalDateTime.now())) {
            throw new AuthenticationFailedException("Compte bloqué. Réessayez dans 2 minutes.");
        }

        // Vérifier timestamp
        long now = System.currentTimeMillis() / 1000;
        if (Math.abs(now - timestamp) > TIMESTAMP_WINDOW) {
            throw new AuthenticationFailedException("Timestamp expiré");
        }

        // Vérifier nonce anti-rejeu
        Optional<AuthNonce> existingNonce = nonceRepository
                .findByUserIdAndNonce(user.getId(), nonce);
        if (existingNonce.isPresent()) {
            throw new AuthenticationFailedException("Nonce déjà utilisé");
        }

        // Enregistrer le nonce
        AuthNonce authNonce = new AuthNonce(user.getId(), nonce);
        nonceRepository.save(authNonce);

        // Recalculer HMAC
        try {
            String password = encryptionService.decrypt(user.getPasswordEncrypted());
            String message = email + ":" + nonce + ":" + timestamp;
            String expectedHmac = hmacService.compute(password, message);

            if (!hmacService.compareConstantTime(expectedHmac, hmac)) {
                int attempts = user.getFailedAttempts() + 1;
                user.setFailedAttempts(attempts);
                if (attempts >= MAX_ATTEMPTS) {
                    user.setLockUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
                }
                userRepository.save(user);
                logger.warn("Login échoué");
                throw new AuthenticationFailedException("Accès refusé");
            }

            user.setFailedAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
            logger.info("Login réussi");
            return "token-" + java.util.UUID.randomUUID();

        } catch (AuthenticationFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthenticationFailedException("Erreur interne");
        }
    }

    /**
     * Valide le mot de passe selon la politique TP2/TP3.
     */
    public boolean isPasswordValid(String password) {
        if (password == null || password.length() < 12) return false;
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * Permet à un utilisateur de changer son mot de passe.
     */
    public void changePassword(String email, String oldPassword,
                               String newPassword, String confirmPassword) {
        // 1. Vérifier que l'utilisateur existe
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidInputException("Utilisateur introuvable"));

        // 2. Vérifier que l'ancien mot de passe est correct
        try {
            String decrypted = encryptionService.decrypt(user.getPasswordEncrypted());
            if (!decrypted.equals(oldPassword)) {
                throw new AuthenticationFailedException("Ancien mot de passe incorrect");
            }
        } catch (AuthenticationFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthenticationFailedException("Erreur de vérification");
        }

        // 3. Vérifier que newPassword et confirmPassword sont identiques
        if (!newPassword.equals(confirmPassword)) {
            throw new InvalidInputException("Les mots de passe ne correspondent pas");
        }

        // 4. Vérifier la force du nouveau mot de passe
        if (!isPasswordValid(newPassword)) {
            throw new InvalidInputException("Mot de passe trop faible");
        }

        // 5. Chiffrer le nouveau mot de passe avec la Master Key
        // 6. Mettre à jour la base de données
        try {
            String encrypted = encryptionService.encrypt(newPassword);
            user.setPasswordEncrypted(encrypted);
            userRepository.save(user);
            logger.info("Mot de passe changé avec succès");
        } catch (Exception e) {
            throw new InvalidInputException("Erreur lors du chiffrement");
        }
    }
}