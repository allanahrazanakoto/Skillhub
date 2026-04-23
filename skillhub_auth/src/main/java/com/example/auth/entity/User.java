package com.example.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un utilisateur en base de données.
 * ATTENTION : Cette implémentation est volontairement dangereuse
 * et ne doit jamais être utilisée en production.
 * TP3 : le mot de passe ne circule plus sur le réseau.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email unique : identifiant principal de l'utilisateur
    @Column(unique = true)
    private String email;

    // Mot de passe chiffré AES-GCM (jamais en clair en base)
    private String passwordEncrypted;

    // Nom de l'utilisateur (ex: "Dupont")
    private String nom;

    // Prénom de l'utilisateur (ex: "Alice")
    private String prenom;

    // Rôle dans SkillHub : "participant" ou "formateur"
    private String role;

    // Compteur de tentatives de connexion échouées (anti brute-force)
    private int failedAttempts;

    // Date jusqu'à laquelle le compte est bloqué (null = pas bloqué)
    private LocalDateTime lockUntil;

    private LocalDateTime createdAt;

    public User() {}

    // Constructeur de base (TP5 original, on ne le modifie pas)
    public User(String email, String passwordEncrypted) {
        this.email = email;
        this.passwordEncrypted = passwordEncrypted;
        this.createdAt = LocalDateTime.now();
        this.failedAttempts = 0;
    }

    // Constructeur SkillHub avec nom et rôle
    public User(String email, String passwordEncrypted, String nom, String role) {
        this.email = email;
        this.passwordEncrypted = passwordEncrypted;
        this.nom = nom;
        // Si aucun rôle fourni, on met "participant" par défaut
        this.role = (role != null && !role.isBlank()) ? role : "participant";
        this.createdAt = LocalDateTime.now();
        this.failedAttempts = 0;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordEncrypted() { return passwordEncrypted; }
    public void setPasswordEncrypted(String passwordEncrypted) { this.passwordEncrypted = passwordEncrypted; }
    // Getter/setter pour le nom de l'utilisateur
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    // Getter/setter pour le prénom
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    // Getter/setter pour le rôle (participant ou formateur)
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
    public LocalDateTime getLockUntil() { return lockUntil; }
    public void setLockUntil(LocalDateTime lockUntil) { this.lockUntil = lockUntil; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}