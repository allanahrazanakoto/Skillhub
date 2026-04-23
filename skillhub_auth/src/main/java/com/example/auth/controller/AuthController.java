package com.example.auth.controller;

import com.example.auth.exception.AuthenticationFailedException;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.AuthService;
import com.example.auth.service.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller REST pour l'authentification SkillHub.
 * Adapté du TP5 pour intégrer les rôles (participant/formateur) et
 * l'endpoint /validate utilisé par le microservice Laravel.
 */
@RestController
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final UserRepository userRepository;

    // Spring Boot injecte automatiquement ces services via le constructeur
    public AuthController(AuthService authService,
                          TokenService tokenService,
                          UserRepository userRepository) {
        this.authService = authService;
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    /**
     * Inscription d'un nouvel utilisateur SkillHub.
     * Accepte en plus du TP5 : nom et role (participant ou formateur).
     *
     * Exemple de body JSON :
     * {
     *   "email": "alice@test.com",
     *   "password": "Pwd1234@",
     *   "nom": "Alice",
     *   "role": "formateur"
     * }
     */
    @PostMapping("/api/auth/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");
        // On récupère nom, prenom et role, avec des valeurs par défaut si absents
        String nom    = body.getOrDefault("nom", "");
        String prenom = body.getOrDefault("prenom", "");
        String role   = body.getOrDefault("role", "participant");

        // On appelle AuthService.register (logique TP5 inchangée)
        // puis on met à jour nom, prenom et role sur l'utilisateur créé
        var user = authService.register(email, password);
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setRole(role);
        userRepository.save(user);

        return ResponseEntity.status(201).body(Map.of(
                "message", "Utilisateur créé avec succès. Vous pouvez maintenant vous connecter."
        ));
    }

    /**
     * Génère un nonce unique pour une session de connexion.
     * Le frontend doit appeler cette route AVANT de se connecter.
     * Le nonce évite les attaques par rejeu (une requête interceptée ne peut pas être réutilisée).
     *
     * Retourne : { "nonce": "abc123...", "timestamp": 1714000000 }
     */
    @GetMapping("/api/auth/nonce")
    public ResponseEntity<Map<String, Object>> nonce() {
        // UUID aléatoire = nonce unique à chaque appel
        String nonce = UUID.randomUUID().toString().replace("-", "");
        // Timestamp actuel en secondes (Unix time)
        long timestamp = System.currentTimeMillis() / 1000;
        return ResponseEntity.ok(Map.<String, Object>of(
                "nonce", nonce,
                "timestamp", timestamp
        ));
    }

    /**
     * Connexion avec HMAC + nonce + timestamp (logique TP5 inchangée).
     * Le frontend calcule HMAC(mot_de_passe, email:nonce:timestamp)
     * et envoie le résultat — le mot de passe ne circule JAMAIS sur le réseau.
     *
     * Exemple de body JSON :
     * {
     *   "email": "alice@test.com",
     *   "nonce": "abc123...",
     *   "timestamp": 1714000000,
     *   "hmac": "e3b0c44298fc..."
     * }
     *
     * Retourne : { "accessToken": "token-xxx", "role": "formateur", "nom": "Alice" }
     */
    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String nonce    = body.get("nonce");
        String hmac     = body.get("hmac");
        long timestamp  = Long.parseLong(body.get("timestamp"));

        // Vérification HMAC + anti-rejeu (logique TP5 inchangée)
        authService.login(email, nonce, timestamp, hmac);

        // Génération du token SSO (valable 15 minutes)
        String token = tokenService.generateToken(email);
        long expiresAt = System.currentTimeMillis() / 1000 + 900;

        // On récupère le rôle et le nom pour les renvoyer au frontend
        var user = userRepository.findByEmail(email).orElseThrow();

        return ResponseEntity.ok(Map.<String, Object>of(
                "accessToken", token,
                "expiresAt",   expiresAt,
                "role",        user.getRole()   != null ? user.getRole()   : "participant",
                "nom",         user.getNom()    != null ? user.getNom()    : "",
                "prenom",      user.getPrenom() != null ? user.getPrenom() : ""
        ));
    }

    /**
     * Validation de token — appelé par Laravel pour vérifier qu'un token est valide.
     * Laravel envoie : GET /api/auth/validate?token=token-xxx
     * Spring Boot répond :
     *   - { valid: true,  email: "...", role: "formateur", nom: "Alice" } si OK
     *   - { valid: false } si le token est expiré ou inconnu
     *
     * C'est le cœur du microservice : Laravel ne gère plus l'auth, il délègue ici.
     */
    @GetMapping("/api/auth/validate")
    public ResponseEntity<Map<String, Object>> validate(
            @RequestParam(value = "token", required = false) String token) {

        // Si pas de token ou token invalide → on répond "non valide"
        if (token == null || !tokenService.isValid(token)) {
            return ResponseEntity.ok(Map.<String, Object>of("valid", false));
        }

        // On récupère l'email associé au token
        String email = tokenService.getEmail(token);

        // On cherche l'utilisateur en base pour avoir son rôle et nom
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(Map.<String, Object>of(
                        "valid",   true,
                        "email",   email,
                        "role",    user.getRole()   != null ? user.getRole()   : "participant",
                        "nom",     user.getNom()    != null ? user.getNom()    : "",
                        "prenom",  user.getPrenom() != null ? user.getPrenom() : ""
                )))
                // Si l'utilisateur n'existe plus en base, token invalide
                .orElse(ResponseEntity.ok(Map.<String, Object>of("valid", false)));
    }

    /**
     * Infos de l'utilisateur connecté (route protégée).
     * Le frontend envoie le token dans le header Authorization.
     */
    @GetMapping("/api/me")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // On extrait le token du header "Bearer token-xxx"
        String token = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7)
                : authHeader;

        if (token == null || !tokenService.isValid(token)) {
            throw new AuthenticationFailedException("Accès refusé : token invalide");
        }

        String email = tokenService.getEmail(token);

        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(Map.<String, Object>of(
                        "email",  email,
                        "nom",    user.getNom()    != null ? user.getNom()    : "",
                        "prenom", user.getPrenom() != null ? user.getPrenom() : "",
                        "role",   user.getRole()   != null ? user.getRole()   : "participant"
                )))
                .orElseThrow(() -> new AuthenticationFailedException("Utilisateur introuvable"));
    }

    /**
     * Changement de mot de passe (logique TP5 inchangée).
     */
    @PutMapping("/api/auth/change-password")
    public ResponseEntity<String> changePassword(@RequestBody Map<String, String> body) {
        authService.changePassword(
                body.get("email"),
                body.get("oldPassword"),
                body.get("newPassword"),
                body.get("confirmPassword")
        );
        return ResponseEntity.ok("Mot de passe changé avec succès");
    }
}