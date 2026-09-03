<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260903124104 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE categories (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, tenant_id BINARY(16) NOT NULL, department_id BINARY(16) DEFAULT NULL, ticket_type_id BINARY(16) DEFAULT NULL, parent_id BINARY(16) DEFAULT NULL, INDEX IDX_3AF34668AE80F5DF (department_id), INDEX IDX_3AF34668C980D5C1 (ticket_type_id), INDEX IDX_3AF34668727ACA70 (parent_id), INDEX idx_cat_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE departments (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, description LONGTEXT DEFAULT NULL, is_active TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_dept_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE pipeline_stages (id BINARY(16) NOT NULL, name VARCHAR(80) NOT NULL, position INT NOT NULL, is_initial TINYINT DEFAULT 0 NOT NULL, is_final TINYINT DEFAULT 0 NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, pipeline_id BINARY(16) NOT NULL, INDEX idx_stage_pipeline (pipeline_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE pipeline_transitions (id BINARY(16) NOT NULL, name VARCHAR(100) DEFAULT NULL, is_active TINYINT DEFAULT 1 NOT NULL, pipeline_id BINARY(16) NOT NULL, from_stage_id BINARY(16) NOT NULL, to_stage_id BINARY(16) NOT NULL, INDEX IDX_7061416E64773109 (from_stage_id), INDEX IDX_7061416EEFC14F3D (to_stage_id), INDEX idx_trans_pipeline (pipeline_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE pipelines (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_pipe_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE priorities (id BINARY(16) NOT NULL, name VARCHAR(60) NOT NULL, weight INT NOT NULL, color_token VARCHAR(30) DEFAULT NULL, is_active TINYINT DEFAULT 1 NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_pri_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tenants (id BINARY(16) NOT NULL, name VARCHAR(150) NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ticket_comments (id BINARY(16) NOT NULL, body LONGTEXT NOT NULL, visibility VARCHAR(20) DEFAULT \'public\' NOT NULL, created_at DATETIME NOT NULL, ticket_id BINARY(16) NOT NULL, author_id BINARY(16) NOT NULL, INDEX IDX_DAF76AAB700047D2 (ticket_id), INDEX IDX_DAF76AABF675F31B (author_id), INDEX idx_comment_ticket (ticket_id, created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ticket_history (id BINARY(16) NOT NULL, action VARCHAR(80) NOT NULL, before_state JSON DEFAULT NULL, after_state JSON DEFAULT NULL, metadata JSON DEFAULT NULL, created_at DATETIME NOT NULL, ticket_id BINARY(16) NOT NULL, actor_id BINARY(16) NOT NULL, INDEX IDX_2B762919700047D2 (ticket_id), INDEX IDX_2B76291910DAF24A (actor_id), INDEX idx_history_ticket (ticket_id, created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE ticket_types (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, tenant_id BINARY(16) NOT NULL, department_id BINARY(16) NOT NULL, INDEX idx_tt_tenant (tenant_id), INDEX idx_tt_department (department_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE tickets (id BINARY(16) NOT NULL, protocol VARCHAR(40) NOT NULL, title VARCHAR(200) NOT NULL, description LONGTEXT NOT NULL, version INT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, resolved_at DATETIME DEFAULT NULL, closed_at DATETIME DEFAULT NULL, tenant_id BINARY(16) NOT NULL, requester_id BINARY(16) NOT NULL, department_id BINARY(16) NOT NULL, type_id BINARY(16) NOT NULL, category_id BINARY(16) DEFAULT NULL, priority_id BINARY(16) NOT NULL, pipeline_id BINARY(16) NOT NULL, current_stage_id BINARY(16) NOT NULL, assigned_user_id BINARY(16) DEFAULT NULL, INDEX IDX_54469DF49033212A (tenant_id), INDEX IDX_54469DF4ED442CF4 (requester_id), INDEX IDX_54469DF4AE80F5DF (department_id), INDEX IDX_54469DF4C54C8C93 (type_id), INDEX IDX_54469DF412469DE2 (category_id), INDEX IDX_54469DF4497B19F9 (priority_id), INDEX IDX_54469DF4E80B93 (pipeline_id), INDEX IDX_54469DF4BFE0ABB9 (current_stage_id), INDEX IDX_54469DF4ADF66B1A (assigned_user_id), INDEX idx_ticket_tenant_created (tenant_id, created_at), INDEX idx_ticket_tenant_stage (tenant_id, current_stage_id), INDEX idx_ticket_tenant_priority (tenant_id, priority_id), INDEX idx_ticket_tenant_assigned (tenant_id, assigned_user_id), INDEX idx_ticket_tenant_requester (tenant_id, requester_id), UNIQUE INDEX uniq_ticket_tenant_protocol (tenant_id, protocol), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id BINARY(16) NOT NULL, name VARCHAR(120) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX IDX_1483A5E99033212A (tenant_id), UNIQUE INDEX uniq_user_tenant_email (tenant_id, email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE categories ADD CONSTRAINT FK_3AF346689033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE categories ADD CONSTRAINT FK_3AF34668AE80F5DF FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE categories ADD CONSTRAINT FK_3AF34668C980D5C1 FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE categories ADD CONSTRAINT FK_3AF34668727ACA70 FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE departments ADD CONSTRAINT FK_16AEB8D49033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pipeline_stages ADD CONSTRAINT FK_C96A438BE80B93 FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pipeline_transitions ADD CONSTRAINT FK_7061416EE80B93 FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pipeline_transitions ADD CONSTRAINT FK_7061416E64773109 FOREIGN KEY (from_stage_id) REFERENCES pipeline_stages (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pipeline_transitions ADD CONSTRAINT FK_7061416EEFC14F3D FOREIGN KEY (to_stage_id) REFERENCES pipeline_stages (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pipelines ADD CONSTRAINT FK_E47C59A29033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE priorities ADD CONSTRAINT FK_D9D940D79033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ticket_comments ADD CONSTRAINT FK_DAF76AAB700047D2 FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ticket_comments ADD CONSTRAINT FK_DAF76AABF675F31B FOREIGN KEY (author_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE ticket_history ADD CONSTRAINT FK_2B762919700047D2 FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ticket_history ADD CONSTRAINT FK_2B76291910DAF24A FOREIGN KEY (actor_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE ticket_types ADD CONSTRAINT FK_7100EABB9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ticket_types ADD CONSTRAINT FK_7100EABBAE80F5DF FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF49033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4ED442CF4 FOREIGN KEY (requester_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4AE80F5DF FOREIGN KEY (department_id) REFERENCES departments (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4C54C8C93 FOREIGN KEY (type_id) REFERENCES ticket_types (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF412469DE2 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4497B19F9 FOREIGN KEY (priority_id) REFERENCES priorities (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4E80B93 FOREIGN KEY (pipeline_id) REFERENCES pipelines (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4BFE0ABB9 FOREIGN KEY (current_stage_id) REFERENCES pipeline_stages (id)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4ADF66B1A FOREIGN KEY (assigned_user_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE users ADD CONSTRAINT FK_1483A5E99033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE categories DROP FOREIGN KEY FK_3AF346689033212A');
        $this->addSql('ALTER TABLE categories DROP FOREIGN KEY FK_3AF34668AE80F5DF');
        $this->addSql('ALTER TABLE categories DROP FOREIGN KEY FK_3AF34668C980D5C1');
        $this->addSql('ALTER TABLE categories DROP FOREIGN KEY FK_3AF34668727ACA70');
        $this->addSql('ALTER TABLE departments DROP FOREIGN KEY FK_16AEB8D49033212A');
        $this->addSql('ALTER TABLE pipeline_stages DROP FOREIGN KEY FK_C96A438BE80B93');
        $this->addSql('ALTER TABLE pipeline_transitions DROP FOREIGN KEY FK_7061416EE80B93');
        $this->addSql('ALTER TABLE pipeline_transitions DROP FOREIGN KEY FK_7061416E64773109');
        $this->addSql('ALTER TABLE pipeline_transitions DROP FOREIGN KEY FK_7061416EEFC14F3D');
        $this->addSql('ALTER TABLE pipelines DROP FOREIGN KEY FK_E47C59A29033212A');
        $this->addSql('ALTER TABLE priorities DROP FOREIGN KEY FK_D9D940D79033212A');
        $this->addSql('ALTER TABLE ticket_comments DROP FOREIGN KEY FK_DAF76AAB700047D2');
        $this->addSql('ALTER TABLE ticket_comments DROP FOREIGN KEY FK_DAF76AABF675F31B');
        $this->addSql('ALTER TABLE ticket_history DROP FOREIGN KEY FK_2B762919700047D2');
        $this->addSql('ALTER TABLE ticket_history DROP FOREIGN KEY FK_2B76291910DAF24A');
        $this->addSql('ALTER TABLE ticket_types DROP FOREIGN KEY FK_7100EABB9033212A');
        $this->addSql('ALTER TABLE ticket_types DROP FOREIGN KEY FK_7100EABBAE80F5DF');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF49033212A');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4ED442CF4');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4AE80F5DF');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4C54C8C93');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF412469DE2');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4497B19F9');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4E80B93');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4BFE0ABB9');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4ADF66B1A');
        $this->addSql('ALTER TABLE users DROP FOREIGN KEY FK_1483A5E99033212A');
        $this->addSql('DROP TABLE categories');
        $this->addSql('DROP TABLE departments');
        $this->addSql('DROP TABLE pipeline_stages');
        $this->addSql('DROP TABLE pipeline_transitions');
        $this->addSql('DROP TABLE pipelines');
        $this->addSql('DROP TABLE priorities');
        $this->addSql('DROP TABLE tenants');
        $this->addSql('DROP TABLE ticket_comments');
        $this->addSql('DROP TABLE ticket_history');
        $this->addSql('DROP TABLE ticket_types');
        $this->addSql('DROP TABLE tickets');
        $this->addSql('DROP TABLE users');
    }
}
