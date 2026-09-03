<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260903214748 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE satisfaction_surveys (id BINARY(16) NOT NULL, score SMALLINT NOT NULL, comment LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, ticket_id BINARY(16) NOT NULL, user_id BINARY(16) NOT NULL, UNIQUE INDEX UNIQ_31984EFD700047D2 (ticket_id), INDEX IDX_31984EFDA76ED395 (user_id), INDEX idx_survey_tenant (tenant_id), INDEX idx_survey_ticket (ticket_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE satisfaction_surveys ADD CONSTRAINT FK_31984EFD9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE satisfaction_surveys ADD CONSTRAINT FK_31984EFD700047D2 FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE satisfaction_surveys ADD CONSTRAINT FK_31984EFDA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE satisfaction_surveys DROP FOREIGN KEY FK_31984EFD9033212A');
        $this->addSql('ALTER TABLE satisfaction_surveys DROP FOREIGN KEY FK_31984EFD700047D2');
        $this->addSql('ALTER TABLE satisfaction_surveys DROP FOREIGN KEY FK_31984EFDA76ED395');
        $this->addSql('DROP TABLE satisfaction_surveys');
    }
}
