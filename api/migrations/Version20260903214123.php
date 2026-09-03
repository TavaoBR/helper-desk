<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260903214123 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE sla_policies (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, description LONGTEXT DEFAULT NULL, is_default TINYINT DEFAULT 0 NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_sla_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE sla_targets (id BINARY(16) NOT NULL, first_response_minutes INT NOT NULL, resolution_minutes INT NOT NULL, business_hours_type VARCHAR(30) DEFAULT \'business\' NOT NULL, sla_policy_id BINARY(16) NOT NULL, priority_id BINARY(16) NOT NULL, INDEX idx_target_policy (sla_policy_id), INDEX idx_target_priority (priority_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE sla_policies ADD CONSTRAINT FK_64A810DA9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sla_targets ADD CONSTRAINT FK_32ADD40037771414 FOREIGN KEY (sla_policy_id) REFERENCES sla_policies (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE sla_targets ADD CONSTRAINT FK_32ADD400497B19F9 FOREIGN KEY (priority_id) REFERENCES priorities (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tickets ADD sla_due_date DATETIME DEFAULT NULL, ADD sla_first_response_due_date DATETIME DEFAULT NULL, ADD sla_breached TINYINT DEFAULT 0 NOT NULL, ADD sla_policy_id BINARY(16) DEFAULT NULL');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF437771414 FOREIGN KEY (sla_policy_id) REFERENCES sla_policies (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_54469DF437771414 ON tickets (sla_policy_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE sla_policies DROP FOREIGN KEY FK_64A810DA9033212A');
        $this->addSql('ALTER TABLE sla_targets DROP FOREIGN KEY FK_32ADD40037771414');
        $this->addSql('ALTER TABLE sla_targets DROP FOREIGN KEY FK_32ADD400497B19F9');
        $this->addSql('DROP TABLE sla_policies');
        $this->addSql('DROP TABLE sla_targets');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF437771414');
        $this->addSql('DROP INDEX IDX_54469DF437771414 ON tickets');
        $this->addSql('ALTER TABLE tickets DROP sla_due_date, DROP sla_first_response_due_date, DROP sla_breached, DROP sla_policy_id');
    }
}
