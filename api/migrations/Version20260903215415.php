<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260903215415 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE automation_rules (id BINARY(16) NOT NULL, name VARCHAR(150) NOT NULL, description LONGTEXT DEFAULT NULL, category VARCHAR(30) NOT NULL, trigger_event VARCHAR(120) NOT NULL, condition_text LONGTEXT NOT NULL, action_text LONGTEXT NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, runs_count INT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_auto_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE automation_rules ADD CONSTRAINT FK_DCEE67FE9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE automation_rules DROP FOREIGN KEY FK_DCEE67FE9033212A');
        $this->addSql('DROP TABLE automation_rules');
    }
}
