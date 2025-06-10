interface TokenInfo {
  access_token: string;
  expires_at: number; // timestamp
  last_refreshed: number; // timestamp
}

class MercadoLibreTokenManager {
  private static instance: MercadoLibreTokenManager;
  private tokenInfo: TokenInfo | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 4 * 60 * 60 * 1000; // 4 horas en ms
  private isInitialized = false;

  private constructor() {
    // No llamamos initializeToken aquí para evitar problemas con async en constructor
  }

  public static getInstance(): MercadoLibreTokenManager {
    if (!MercadoLibreTokenManager.instance) {
      MercadoLibreTokenManager.instance = new MercadoLibreTokenManager();
    }
    return MercadoLibreTokenManager.instance;
  }

  private async initializeToken() {
    if (this.isInitialized) return;

    console.log('🔐 [Token Manager] Inicializando token...');

    const token = process.env.MERCADOLIBRE_ACCESS_TOKEN;
    if (token) {
      // Verificar si el token actual es válido probando una llamada a la API
      const isValid = await this.verifyToken(token);

      if (isValid) {
        this.tokenInfo = {
          access_token: token,
          expires_at: Date.now() + 6 * 60 * 60 * 1000, // 6 horas desde ahora
          last_refreshed: Date.now()
        };
        console.log('✅ [Token Manager] Token actual es válido');
      } else {
        console.log('⚠️ [Token Manager] Token actual inválido, renovando...');
        await this.refreshToken();
      }
    } else {
      console.log(
        '⚠️ [Token Manager] No hay token en las variables de entorno, renovando...'
      );
      await this.refreshToken();
    }

    this.startAutoRefresh();
    this.isInitialized = true;
  }

  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.mercadolibre.com/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('❌ [Token Manager] Error verificando token:', error);
      return false;
    }
  }

  private startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      try {
        console.log(
          '⏰ [Token Manager] Renovación automática programada iniciada'
        );
        await this.refreshToken();
      } catch (error) {
        console.error(
          '❌ [Token Manager] Error en renovación automática:',
          error
        );
      }
    }, this.REFRESH_INTERVAL);

    console.log(
      `⏰ [Token Manager] Auto-refresh configurado cada ${this.REFRESH_INTERVAL / 1000 / 60} minutos`
    );
  }

  public async getValidToken(): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeToken();
    }

    if (!this.tokenInfo) {
      console.log('⚠️ [Token Manager] No hay token disponible, renovando...');
      await this.refreshToken();
    }

    // Si el token está próximo a expirar (menos de 30 minutos), renovarlo
    const thirtyMinutes = 30 * 60 * 1000;
    if (
      this.tokenInfo &&
      this.tokenInfo.expires_at - Date.now() < thirtyMinutes
    ) {
      console.log('⚠️ [Token Manager] Token próximo a expirar, renovando...');
      await this.refreshToken();
    }

    return this.tokenInfo?.access_token || '';
  }

  private async refreshToken(): Promise<void> {
    try {
      console.log('🔄 [Token Manager] Iniciando renovación de token...');

      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.MERCADOLIBRE_CLIENT_ID || '',
          client_secret: process.env.MERCADOLIBRE_CLIENT_SECRET || '',
          refresh_token: process.env.MERCADOLIBRE_REFRESH_TOKEN || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to refresh token: ${response.status} - ${errorData}`
        );
      }

      const data = await response.json();

      this.tokenInfo = {
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
        last_refreshed: Date.now()
      };

      // Actualizar la variable de entorno para otras partes del código
      process.env.MERCADOLIBRE_ACCESS_TOKEN = data.access_token;

      console.log('✅ [Token Manager] Token renovado exitosamente');
      console.log(
        `📅 [Token Manager] Próxima renovación en ${new Date(Date.now() + this.REFRESH_INTERVAL).toLocaleString()}`
      );

      // Verificar que el nuevo token funciona
      const isValid = await this.verifyToken(data.access_token);
      if (!isValid) {
        console.error('❌ [Token Manager] El token renovado no es válido');
        throw new Error('El token renovado no es válido');
      }
    } catch (error) {
      console.error('❌ [Token Manager] Error renovando token:', error);
      throw error;
    }
  }

  public async forceRefresh(): Promise<void> {
    await this.refreshToken();
  }

  public getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  public destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isInitialized = false;
  }
}

export const tokenManager = MercadoLibreTokenManager.getInstance();
