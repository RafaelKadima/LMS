#!/bin/bash
# ===========================================
# Setup do Jitsi Meet Self-Hosted
# Universidade MotoChefe
# ===========================================
#
# Uso: ./setup.sh
# Deve ser executado no servidor (93.127.211.241)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Jitsi Meet - Setup Universidade MotoChefe"
echo "============================================"
echo ""

# -----------------------------------------------
# 1. Gerar segredos XMPP se não existirem
# -----------------------------------------------
generate_secret() {
    openssl rand -hex 16
}

if [ ! -f .env ]; then
    echo "[1/4] Criando .env a partir do template..."
    cp .env.jitsi.example .env

    # Gerar segredos automáticos
    JICOFO_COMPONENT_SECRET=$(generate_secret)
    JICOFO_AUTH_PASSWORD=$(generate_secret)
    JVB_AUTH_PASSWORD=$(generate_secret)

    # Substituir no .env
    sed -i "s|^JICOFO_COMPONENT_SECRET=.*|JICOFO_COMPONENT_SECRET=${JICOFO_COMPONENT_SECRET}|" .env
    sed -i "s|^JICOFO_AUTH_PASSWORD=.*|JICOFO_AUTH_PASSWORD=${JICOFO_AUTH_PASSWORD}|" .env
    sed -i "s|^JVB_AUTH_PASSWORD=.*|JVB_AUTH_PASSWORD=${JVB_AUTH_PASSWORD}|" .env

    echo "    Segredos XMPP gerados automaticamente."
    echo ""
    echo "    IMPORTANTE: Edite o .env e confirme:"
    echo "    - PUBLIC_URL (domínio do Jitsi)"
    echo "    - JVB_ADVERTISE_IPS (IP público do servidor)"
    echo ""
else
    echo "[1/4] .env já existe, mantendo configuração atual."
fi

# -----------------------------------------------
# 2. Criar diretórios de configuração
# -----------------------------------------------
echo "[2/4] Criando diretórios de configuração..."
mkdir -p jitsi-config/{web,prosody/config,prosody/prosody-plugins-custom,jicofo,jvb,transcripts}
mkdir -p jitsi-config/web/crontabs

echo "    Diretórios criados em jitsi-config/"

# -----------------------------------------------
# 3. Verificar portas necessárias
# -----------------------------------------------
echo "[3/4] Verificando portas..."

check_port() {
    local port=$1
    local proto=${2:-tcp}
    if ss -tuln | grep -q ":${port} "; then
        echo "    AVISO: Porta ${port}/${proto} já está em uso!"
        return 1
    else
        echo "    Porta ${port}/${proto} livre ✓"
        return 0
    fi
}

check_port 8443 tcp || true
check_port 10000 udp || true

# -----------------------------------------------
# 4. Orientações finais
# -----------------------------------------------
echo "[4/4] Setup concluído!"
echo ""
echo "============================================"
echo "  Próximos passos:"
echo "============================================"
echo ""
echo "  1. Confirme o .env (especialmente PUBLIC_URL e JVB_ADVERTISE_IPS)"
echo ""
echo "  2. Configure DNS: crie um registro A para"
echo "     meet.universidademotochefe.com.br → 93.127.211.241"
echo ""
echo "  3. Configure Nginx (veja nginx-jitsi.conf)"
echo ""
echo "  4. Gere certificado SSL:"
echo "     certbot certonly --nginx -d meet.universidademotochefe.com.br"
echo ""
echo "  5. Inicie os containers:"
echo "     docker compose -f docker-compose.jitsi.yml up -d"
echo ""
echo "  6. Verifique os logs:"
echo "     docker compose -f docker-compose.jitsi.yml logs -f"
echo ""
echo "  7. Abra as portas no firewall:"
echo "     ufw allow 10000/udp  (tráfego de vídeo WebRTC)"
echo ""
echo "============================================"
