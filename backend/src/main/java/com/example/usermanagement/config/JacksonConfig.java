package com.example.usermanagement.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration
public class JacksonConfig {

    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Enregistrer le module Java 8 Time
        mapper.registerModule(new JavaTimeModule());
        
        // Configuration pour éviter les boucles infinies
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        // Ignorer les propriétés null
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        return new MappingJackson2HttpMessageConverter(mapper);
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Enregistrer le module Java 8 Time
        mapper.registerModule(new JavaTimeModule());
        
        // Configuration pour éviter les boucles infinies
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        // Ignorer les propriétés null
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        return mapper;
    }
}
