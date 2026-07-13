package com.example.usermanagement.repository;

import com.example.usermanagement.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    
    Optional<Branch> findByBranchCode(String branchCode);
    
    List<Branch> findByGeoareaCode(String geoareaCode);
    
    List<Branch> findByActiveTrue();
    
    List<Branch> findByActiveFalse();
    
    @Query("SELECT b FROM Branch b WHERE b.name LIKE %:name%")
    List<Branch> findByNameContaining(String name);
    
    boolean existsByBranchCode(String branchCode);
}
