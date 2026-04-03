-- CreateTable GeneralSettings
CREATE TABLE "GeneralSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255) NOT NULL,
    "principal" VARCHAR(255) NOT NULL,
    "year" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable SecuritySettings
CREATE TABLE "SecuritySettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT true,
    "enableTwoFactor" BOOLEAN NOT NULL DEFAULT false,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable NotificationSettings
CREATE TABLE "NotificationSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "browserNotifications" BOOLEAN NOT NULL DEFAULT true,
    "gradeUpdates" BOOLEAN NOT NULL DEFAULT true,
    "attendanceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "systemUpdates" BOOLEAN NOT NULL DEFAULT true,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable AppearanceSettings
CREATE TABLE "AppearanceSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "theme" VARCHAR(50) NOT NULL DEFAULT 'light',
    "primaryColor" VARCHAR(7) NOT NULL DEFAULT '#003366',
    "accentColor" VARCHAR(7) NOT NULL DEFAULT '#C39D5B',
    "fontSize" VARCHAR(50) NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppearanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable DatabaseSettings
CREATE TABLE "DatabaseSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" VARCHAR(50) NOT NULL DEFAULT 'daily',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmailSettings
CREATE TABLE "EmailSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "smtpServer" VARCHAR(255) NOT NULL,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "senderEmail" VARCHAR(255) NOT NULL,
    "senderName" VARCHAR(255) NOT NULL,
    "useSSL" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);
