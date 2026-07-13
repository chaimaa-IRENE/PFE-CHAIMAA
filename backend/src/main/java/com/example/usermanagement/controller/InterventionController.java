package com.example.usermanagement.controller;

import com.example.usermanagement.model.Intervention;
import com.example.usermanagement.service.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interventions")
public class InterventionController {
    @Autowired
    private InterventionService service;

    @GetMapping
    public List<Intervention> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}/takeCharge")
    public Intervention takeCharge(@PathVariable Long id) {
        return service.takeCharge(id);
    }

    @PutMapping("/{id}/update")
    public Intervention update(@PathVariable Long id, @RequestBody Intervention intervention) {
        return service.updateIntervention(id, intervention);
    }
}

