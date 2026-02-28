package com.cctrs.backend.startup;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Applies idempotent DDL migrations at startup before any requests are served.
 *
 * <p>All statements here are safe to re-run (they check the current state first),
 * so they can be left in place across re-deployments.</p>
 */
@Component
@Order(1)  // Run before DataLoader / AdminDataLoader
public class SchemaMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrationRunner.class);

    private final JdbcTemplate jdbc;

    public SchemaMigrationRunner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        fixProofImageColumnType();
    }

    /**
     * Migration: proof_image was declared as VARCHAR(500) / VARCHAR(255) in
     * earlier schema versions. The application encodes uploaded images as Base64
     * before persisting them, which can produce millions of characters – far
     * beyond any varchar limit.
     *
     * <p>This migration changes the column type to TEXT (unlimited length) so
     * that INSERT/UPDATE statements no longer throw:
     * "ERROR: value too long for type character varying(500)"</p>
     */
    private void fixProofImageColumnType() {
        try {
            // Query the information_schema to check the current data type
            String checkSql =
                "SELECT data_type FROM information_schema.columns " +
                "WHERE table_name = 'activities' AND column_name = 'proof_image'";

            String currentType = jdbc.query(checkSql, rs -> {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
                return null;
            });

            if (currentType == null) {
                log.warn("SchemaMigration: column activities.proof_image not found; skipping.");
                return;
            }

            // text == already fixed; character varying == needs fixing
            if ("text".equalsIgnoreCase(currentType)) {
                log.info("SchemaMigration: activities.proof_image is already TEXT; no action needed.");
                return;
            }

            log.info("SchemaMigration: changing activities.proof_image from {} to TEXT ...", currentType);
            jdbc.execute("ALTER TABLE activities ALTER COLUMN proof_image TYPE TEXT");
            log.info("SchemaMigration: activities.proof_image successfully altered to TEXT.");

        } catch (Exception e) {
            // Log but do not crash startup; the column may already be correct
            // or the DB user may lack ALTER privileges – in either case the
            // DBA can apply database/migration_fix_proof_image_size.sql manually.
            log.error("SchemaMigration: failed to alter proof_image column – " +
                      "please run database/migration_fix_proof_image_size.sql manually. " +
                      "Error: {}", e.getMessage());
        }
    }
}
