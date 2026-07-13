package com.example.usermanagement.repository;

import com.example.usermanagement.model.DeclarationFormData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclarationFormDataRepository extends JpaRepository<DeclarationFormData, Long> {
    List<DeclarationFormData> findByChauffeurId(Long chauffeurId);
}
