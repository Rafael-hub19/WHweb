<?php
// includes/paypal.php — PayPal Orders API v2 via cURL (sin Composer)
require_once __DIR__ . '/config.php';

class PayPalClient {
    private string $clientId;
    private string $clientSecret;
    private string $apiUrl;
    private ?string $accessToken = null;
    private int $tokenExpiry = 0;

    public function __construct(string $clientId = '', string $clientSecret = '') {
        $this->clientId     = $clientId ?: PAYPAL_CLIENT_ID;
        $this->clientSecret = $clientSecret ?: PAYPAL_CLIENT_SECRET;
        $this->apiUrl       = PAYPAL_API_URL;
    }

    private function getAccessToken(): string {
        if ($this->accessToken && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }

        $ch = curl_init($this->apiUrl . '/v1/oauth2/token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
            CURLOPT_USERPWD        => $this->clientId . ':' . $this->clientSecret,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'Accept-Language: es_MX',
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new RuntimeException('PayPal autenticación falló: ' . $response);
        }

        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'] ?? '';
        $this->tokenExpiry = time() + (int)($data['expires_in'] ?? 3600) - 60;

        return $this->accessToken;
    }

    private function request(string $method, string $endpoint, array $body = []): array {
        $token = $this->getAccessToken();
        $url = $this->apiUrl . $endpoint;
        $method = strtoupper($method);

        $requestId = uniqid('wh-', true);
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
            'Prefer: return=representation',
            'PayPal-Request-Id: ' . $requestId,
        ];

        $ch = curl_init();
        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ];

        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = $body ? json_encode($body) : '{}';
        } elseif ($method === 'PATCH') {
            $options[CURLOPT_CUSTOMREQUEST] = 'PATCH';
            $options[CURLOPT_POSTFIELDS] = json_encode($body);
        } elseif ($method === 'GET' && $body) {
            $options[CURLOPT_URL] = $url . '?' . http_build_query($body);
        }

        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new RuntimeException('PayPal cURL error: ' . $curlError);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            if ($response === '' || $response === null) return ['http_code' => $httpCode];
            throw new RuntimeException('PayPal respuesta inválida (HTTP ' . $httpCode . '): ' . $response);
        }

        if (isset($decoded['error']) || (isset($decoded['name']) && $httpCode >= 400)) {
            $msg = $decoded['message'] ?? $decoded['error_description'] ?? $decoded['name'] ?? 'Error PayPal';
            throw new RuntimeException('PayPal error: ' . $msg);
        }

        return $decoded;
    }

    public function crearOrden(float $monto, string $pedidoNum, string $returnUrl, string $cancelUrl): array {
        $body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $pedidoNum,
                'description'  => 'Pedido Wooden House ' . $pedidoNum,
                'amount'       => [
                    'currency_code' => 'MXN',
                    'value'         => number_format($monto, 2, '.', ''),
                ],
            ]],
            'application_context' => [
                'brand_name'          => 'Wooden House',
                'locale'              => 'es-MX',
                'landing_page'        => 'BILLING',
                'shipping_preference' => 'NO_SHIPPING',
                'user_action'         => 'PAY_NOW',
                'return_url'          => $returnUrl,
                'cancel_url'          => $cancelUrl,
            ],
        ];
        return $this->request('POST', '/v2/checkout/orders', $body);
    }

    public function capturarOrden(string $orderId): array {
        return $this->request('POST', "/v2/checkout/orders/{$orderId}/capture");
    }

    public function obtenerOrden(string $orderId): array {
        return $this->request('GET', "/v2/checkout/orders/{$orderId}");
    }

    public function reembolsar(string $captureId, ?float $monto = null, string $moneda = 'MXN'): array {
        $body = [];
        if ($monto !== null) {
            $body['amount'] = [
                'currency_code' => $moneda,
                'value'         => number_format($monto, 2, '.', ''),
            ];
        }
        return $this->request('POST', "/v2/payments/captures/{$captureId}/refund", $body);
    }

    public function getApproveUrl(array $orderResponse): ?string {
        foreach ($orderResponse['links'] ?? [] as $link) {
            if ($link['rel'] === 'approve') {
                return $link['href'];
            }
        }
        return null;
    }

    // PayPal no usa HMAC local — verifica contra su propia API
    public function verificarWebhook(string $payload, array $headers = [], string $webhookId = ''): ?array {
        $data = json_decode($payload, true);
        if (!is_array($data)) return null;

        $webhookId = $webhookId ?: (defined('PAYPAL_WEBHOOK_ID') ? PAYPAL_WEBHOOK_ID : '');

        // Si no hay webhookId configurado, solo parsear (modo desarrollo sin verificación)
        if (!$webhookId) {
            error_log('[PayPal Webhook] ADVERTENCIA: PAYPAL_WEBHOOK_ID no configurado. Verificación omitida.');
            return $data;
        }

        $authAlgo         = $headers['HTTP_PAYPAL_AUTH_ALGO']         ?? $headers['PAYPAL_AUTH_ALGO']         ?? '';
        $certUrl          = $headers['HTTP_PAYPAL_CERT_URL']          ?? $headers['PAYPAL_CERT_URL']          ?? '';
        $transmissionId   = $headers['HTTP_PAYPAL_TRANSMISSION_ID']   ?? $headers['PAYPAL_TRANSMISSION_ID']   ?? '';
        $transmissionSig  = $headers['HTTP_PAYPAL_TRANSMISSION_SIG']  ?? $headers['PAYPAL_TRANSMISSION_SIG']  ?? '';
        $transmissionTime = $headers['HTTP_PAYPAL_TRANSMISSION_TIME'] ?? $headers['PAYPAL_TRANSMISSION_TIME'] ?? '';

        if (!$transmissionId || !$transmissionSig) {
            error_log('[PayPal Webhook] Headers de firma ausentes — posible request no auténtico');
            return null;
        }

        try {
            $token = $this->getAccessToken();
            $verifyBody = [
                'auth_algo'         => $authAlgo,
                'cert_url'          => $certUrl,
                'transmission_id'   => $transmissionId,
                'transmission_sig'  => $transmissionSig,
                'transmission_time' => $transmissionTime,
                'webhook_id'        => $webhookId,
                'webhook_event'     => $data,
            ];

            $ch = curl_init($this->apiUrl . '/v1/notifications/verify-webhook-signature');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($verifyBody),
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $token,
                ],
                CURLOPT_TIMEOUT        => 15,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $result = json_decode($response, true);
            $verificationStatus = $result['verification_status'] ?? '';

            if ($httpCode !== 200 || $verificationStatus !== 'SUCCESS') {
                error_log('[PayPal Webhook] Verificación fallida. HTTP: ' . $httpCode . ' Status: ' . $verificationStatus);
                return null;
            }

            return $data;
        } catch (\Exception $e) {
            error_log('[PayPal Webhook] Error verificando firma: ' . $e->getMessage());
            return null;
        }
    }
}

function paypal(): PayPalClient {
    static $instance = null;
    if ($instance === null) $instance = new PayPalClient();
    return $instance;
}
