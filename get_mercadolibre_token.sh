#!/bin/bash

# Script para obtener Access Token de MercadoLibre
# Reemplaza estos valores con los tuyos:

CLIENT_ID="TU_CLIENT_ID"
CLIENT_SECRET="TU_CLIENT_SECRET"
CODE="TU_CODIGO_DE_AUTORIZACION"
REDIRECT_URI="http://localhost:3000/auth/mercadolibre/callback"

echo "=== MercadoLibre OAuth Token Generator ==="
echo ""
echo "1. Configura tu app con estas Redirect URLs:"
echo "   - http://localhost:3000/auth/mercadolibre/callback"
echo "   - http://localhost:3001/auth/mercadolibre/callback"
echo ""
echo "2. Visita esta URL para autorizar (reemplaza TU_CLIENT_ID):"
echo "   https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read%20write"
echo ""
echo "3. Obteniendo Access Token..."

curl -X POST \
  -H "accept: application/json" \
  -H "content-type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${CODE}&redirect_uri=${REDIRECT_URI}" \
  https://api.mercadolibre.com/oauth/token

echo ""
echo "=== Siguiente Paso ==="
echo "Copia el access_token y refresh_token al archivo .env.local" 