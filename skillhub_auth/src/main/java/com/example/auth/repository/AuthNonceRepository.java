package com.example.auth.repository;

import com.example.auth.entity.AuthNonce;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository pour accéder aux nonces d'authentification.
 * ATTENTION : Cette implémentation est volontairement dangereuse
 * et ne doit jamais être utilisée en production.
 */
public interface AuthNonceRepository extends JpaRepository<AuthNonce, Long> {
    Optional<AuthNonce> findByUserIdAndNonce(Long userId, String nonce);
}