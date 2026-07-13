package com.example.usermanagement.config;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.h2.tools.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import java.sql.SQLException;

@Configuration
public class H2TcpServerConfig {

    private static final Logger log = LoggerFactory.getLogger(H2TcpServerConfig.class);
    private Server tcpServer;

    @PostConstruct
    public void startTcpServer() {
        try {
            tcpServer = Server.createTcpServer("-tcp", "-tcpAllowOthers", "-tcpPort", "9092", "-ifNotExists").start();
            log.info("H2 TCP Server démarré sur port 9092");
            log.info("URL JDBC pour Power BI / DBeaver:");
            log.info("  jdbc:h2:tcp://localhost:9092/./data/driverhub");
            log.info("  Utilisateur: sa  /  Mot de passe: password");
            log.info("Console H2: http://localhost:8080/h2-console");
        } catch (SQLException e) {
            log.error("Erreur démarrage H2 TCP Server: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void stopTcpServer() {
        if (tcpServer != null) {
            tcpServer.stop();
            log.info("H2 TCP Server arrêté");
        }
    }
}
