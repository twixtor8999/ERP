# Deployment Architecture & Guidelines

This directory contains cloud deployment specifications for **AI Smart Bazar**.

## Principles

1. **Cloud Portability**: No provider lock-in. The application packages as standard container images (`ai_smart_bazar_api` and `ai_smart_bazar_web`) operable on AWS ECS/Fargate, Google Cloud Run, Azure Container Apps, DigitalOcean App Platform, or Linux VPS with Docker Compose.
2. **Environment Injected Secrets**: All credentials (database connection strings, secret keys, cloud storage credentials) must be injected via runtime environment variables and never bundled into container layers.
3. **HTTPS & Edge Termination**: Production traffic must be terminated at a managed TLS edge load balancer or reverse proxy (e.g. Cloudflare, AWS ALB, Nginx).
4. **Multi-Branch Data Isolation**: Storage buckets and PostgreSQL connection pools must be configured with appropriate connection limits and private networking.

