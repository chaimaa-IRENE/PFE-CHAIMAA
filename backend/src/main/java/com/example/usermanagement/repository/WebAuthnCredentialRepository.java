package com.example.usermanagement.repository;

import com.example.usermanagement.model.WebAuthnCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {
    List<WebAuthnCredential> findByUserId(Long userId);
    Optional<WebAuthnCredential> findByCredentialId(String credentialId);
    boolean existsByUserId(Long userId);
    void deleteByUserId(Long userId);
}
