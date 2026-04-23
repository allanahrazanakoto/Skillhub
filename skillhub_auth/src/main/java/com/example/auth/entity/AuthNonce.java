package com.example.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un nonce d'authentification.
 * Utilisé pour la protection anti-rejeu du TP3.
 */
@Entity
@Table(name = "auth_nonce",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "nonce"}))
public class AuthNonce {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String nonce;

    private LocalDateTime expiresAt;

    private boolean consumed;

    private LocalDateTime createdAt;

    public AuthNonce() {}

    public AuthNonce(Long userId, String nonce) {
        this.userId = userId;
        this.nonce = nonce;
        this.expiresAt = LocalDateTime.now().plusMinutes(2);
        this.consumed = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getNonce() { return nonce; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}