package com.cctrs.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test — verifies Spring context wires correctly WITHOUT a database connection.
 *
 * DataSource, JPA, and Mail auto-configuration are excluded so this test runs
 * in CI / locally without requiring Supabase credentials or network access.
 * Stub values for placeholder resolution only; no actual connections are made.
 */
@SpringBootTest(
    properties = {
        // No prod profile during tests — avoids loading application-prod.properties
        "spring.profiles.active=",
        // Exclude all infrastructure auto-configuration that requires live connections
        "spring.autoconfigure.exclude=" +
            "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
            "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
            "org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration," +
            "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration," +
            "org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration",
        "SMTP_USERNAME=stub@test.local",
        "SMTP_PASSWORD=stub"
    }
)
class CctrsBackendApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the non-infrastructure Spring beans wire correctly
    }

}
