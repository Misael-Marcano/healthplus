#!/bin/bash
# Inicia SQL Server en segundo plano
/opt/mssql/bin/sqlservr &
SQLPID=$!

# Detecta la versión de sqlcmd disponible
SQLCMD=""
for path in /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd; do
  [ -x "$path" ] && SQLCMD="$path" && break
done

if [ -z "$SQLCMD" ]; then
  echo "ERROR: sqlcmd no encontrado."
  wait $SQLPID
  exit 1
fi

# Espera a que SQL Server esté listo (máximo ~2 min)
echo "Esperando a que SQL Server inicie..."
RETRIES=40
while [ $RETRIES -gt 0 ]; do
  # -C: trust self-signed certificate (requerido en mssql-tools18)
  $SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1" -C -b > /dev/null 2>&1 && break
  RETRIES=$((RETRIES - 1))
  sleep 3
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: SQL Server no respondió a tiempo."
  wait $SQLPID
  exit 1
fi

echo "SQL Server listo. Creando base de datos..."

$SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -C -b -Q \
  "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'healthplus_db') CREATE DATABASE [healthplus_db]"

echo "Base de datos 'healthplus_db' lista."

# Mantiene el proceso del servidor activo
wait $SQLPID
