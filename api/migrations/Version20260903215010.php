<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260903215010 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE in_app_notifications (id BINARY(16) NOT NULL, title VARCHAR(150) NOT NULL, message LONGTEXT NOT NULL, is_read TINYINT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, user_id BINARY(16) NOT NULL, ticket_id BINARY(16) DEFAULT NULL, INDEX IDX_765FFE1C9033212A (tenant_id), INDEX IDX_765FFE1CA76ED395 (user_id), INDEX IDX_765FFE1C700047D2 (ticket_id), INDEX idx_notif_user (user_id, is_read), INDEX idx_notif_created (created_at), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification_settings (id BINARY(16) NOT NULL, event_key VARCHAR(80) NOT NULL, recipient_type VARCHAR(20) NOT NULL, channel_email TINYINT DEFAULT 1 NOT NULL, channel_in_app TINYINT DEFAULT 1 NOT NULL, channel_push TINYINT DEFAULT 0 NOT NULL, is_active TINYINT DEFAULT 1 NOT NULL, updated_at DATETIME NOT NULL, tenant_id BINARY(16) NOT NULL, INDEX idx_notif_tenant (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE in_app_notifications ADD CONSTRAINT FK_765FFE1C9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE in_app_notifications ADD CONSTRAINT FK_765FFE1CA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE in_app_notifications ADD CONSTRAINT FK_765FFE1C700047D2 FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE notification_settings ADD CONSTRAINT FK_B05598609033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE in_app_notifications DROP FOREIGN KEY FK_765FFE1C9033212A');
        $this->addSql('ALTER TABLE in_app_notifications DROP FOREIGN KEY FK_765FFE1CA76ED395');
        $this->addSql('ALTER TABLE in_app_notifications DROP FOREIGN KEY FK_765FFE1C700047D2');
        $this->addSql('ALTER TABLE notification_settings DROP FOREIGN KEY FK_B05598609033212A');
        $this->addSql('DROP TABLE in_app_notifications');
        $this->addSql('DROP TABLE notification_settings');
    }
}
