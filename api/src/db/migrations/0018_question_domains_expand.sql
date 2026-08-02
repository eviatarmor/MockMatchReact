-- Expand global question bank domains (interview-breadth pack)
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'dataScience';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'ml';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'security';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'devops';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'design';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'consulting';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE "public"."question_domain" ADD VALUE IF NOT EXISTS 'sales';
