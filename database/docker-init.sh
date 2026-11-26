#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=workflow_password="$WORKFLOW_DB_PASSWORD" <<'SQL'
CREATE ROLE workflow LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'workflow_password';
ALTER DATABASE workflow OWNER TO workflow;
SQL
