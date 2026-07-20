# PostgreSQL 16 with pgvector (preinstalled) + pgaudit
FROM pgvector/pgvector:pg16

# pgaudit from PGDG apt repo (matches official postgres image base)
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-16-pgaudit \
  && rm -rf /var/lib/apt/lists/*

# Required for CREATE EXTENSION pgaudit
CMD ["postgres", "-c", "shared_preload_libraries=pgaudit"]
