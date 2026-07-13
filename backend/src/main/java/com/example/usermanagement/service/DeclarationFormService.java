package com.example.usermanagement.service;

import com.example.usermanagement.model.DeclarationFormData;
import com.example.usermanagement.repository.DeclarationFormDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class DeclarationFormService {

    @Autowired
    private SpeechService speechService;

    @Autowired
    private DeclarationFormDataRepository declarationFormDataRepository;

    /**
     * Traite une réponse audio pour un champ spécifique du formulaire
     */
    public String[] traiterReponseAudio(MultipartFile audioFile, String champ) throws IOException {
        return speechService.transcrireEtTraduire(audioFile);
    }

    /**
     * Sauvegarde une déclaration complète avec toutes les réponses
     */
    public DeclarationFormData sauvegarderDeclaration(DeclarationFormData declarationFormData) {
        return declarationFormDataRepository.save(declarationFormData);
    }

    /**
     * Récupère toutes les déclarations d'un chauffeur
     */
    public java.util.List<DeclarationFormData> getDeclarationsParChauffeur(Long chauffeurId) {
        return declarationFormDataRepository.findByChauffeurId(chauffeurId);
    }

    /**
     * Récupère une déclaration par ID
     */
    public DeclarationFormData getDeclarationById(Long id) {
        return declarationFormDataRepository.findById(id).orElse(null);
    }
}
