<?php
// =============================================================
// Wooden House - Stripe PHP Library (via cURL - sin Composer)
// Implementa Stripe PHP SDK v7 compatible con cURL directo
// =============================================================
require_once __DIR__ . '/config.php';

class StripeClient {
    private string $secretKey;
    private string $apiUrl = 'https://api.stripe.com/v1';

    public function __construct(string $secretKey = '') {
        $this->secretKey = $secretKey ?: STRIPE_SECRET_KEY;
    }

    /**
     * Petición base a Stripe API
     */
    private function request(string $method, string $endpoint, array $data = []): array {
        $url = $this->apiUrl . $endpoint;

        $ch = curl_init();
        $headers = [
            'Authorization: Bearer ' . $this->secretKey,
            'Content-Type: application/x-www-form-urlencoded',
            'Stripe-Version: 2025-01-27.acacia',
        ];

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ];

        $method = strtoupper($method);
        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = http_build_query($data, '', '&');
        } elseif ($method === 'GET' && $data) {
            $options[CURLOPT_URL] = $url . '?' . http_build_query($data);
        } elseif ($method === 'DELETE') {
            $options[CURLOPT_CUSTOMREQUEST] = 'DELETE';
        }

        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new RuntimeException('Stripe cURL error: ' . $curlError);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Stripe respuesta inválida: ' . $response);
        }

        if (isset($decoded['error'])) {
            throw new RuntimeException(
                'Stripe error: ' . ($decoded['error']['message'] ?? 'Error desconocido') .
                ' [' . ($decoded['error']['code'] ?? 'unknown') . ']'
            );
        }

        return $decoded;
    }

    /**
     * Crear Payment Intent
     * @param int $amountCentavos Monto en centavos MXN (ej: 850000 = $8,500)
     */
    public function crearPaymentIntent(int $amountCentavos, string $currency = 'mxn', array $metadata = []): array {
        $data = [
            'amount'               => $amountCentavos,
            'currency'             => strtolower($currency),
            'payment_method_types' => ['card'],
            'capture_method'       => 'automatic',
        ];
        if ($metadata) {
            foreach ($metadata as $k => $v) {
                $data["metadata[$k]"] = $v;
            }
        }
        return $this->request('POST', '/payment_intents', $data);
    }

    /**
     * Obtener Payment Intent por ID
     */
    public function obtenerPaymentIntent(string $paymentIntentId): array {
        return $this->request('GET', '/payment_intents/' . $paymentIntentId);
    }

    /**
     * Actualizar metadata de Payment Intent
     */
    public function actualizarPaymentIntent(string $paymentIntentId, array $data): array {
        return $this->request('POST', '/payment_intents/' . $paymentIntentId, $data);
    }

    /**
     * Cancelar Payment Intent
     */
    public function cancelarPaymentIntent(string $paymentIntentId): array {
        return $this->request('POST', '/payment_intents/' . $paymentIntentId . '/cancel');
    }

    /**
     * Reembolso
     */
    public function reembolsar(string $paymentIntentId, ?int $amountCentavos = null): array {
        $data = ['payment_intent' => $paymentIntentId];
        if ($amountCentavos !== null) {
            $data['amount'] = $amountCentavos;
        }
        return $this->request('POST', '/refunds', $data);
    }

    /**
     * Verificar firma de webhook de Stripe
     */
    public function verificarWebhook(string $payload, string $sigHeader, string $secret = ''): ?array {
        $secret = $secret ?: STRIPE_WEBHOOK_SECRET;
        $tolerance = 300; // 5 minutos

        if (!preg_match('/t=(\d+)/', $sigHeader, $tMatch)) return null;
        $timestamp = (int)$tMatch[1];

        if (abs(time() - $timestamp) > $tolerance) return null;

        // Calcular firma esperada
        $signedPayload = $timestamp . '.' . $payload;
        $expectedSig = hash_hmac('sha256', $signedPayload, $secret);

        // Comparar con las firmas en el header (puede haber múltiples v1=...)
        $valid = false;
        foreach (explode(',', $sigHeader) as $part) {
            $part = trim($part);
            if (str_starts_with($part, 'v1=')) {
                $sig = substr($part, 3);
                if (hash_equals($expectedSig, $sig)) {
                    $valid = true;
                    break;
                }
            }
        }

        if (!$valid) return null;

        $event = json_decode($payload, true);
        return is_array($event) ? $event : null;
    }
}

// Instancia global
function stripe(): StripeClient {
    static $instance = null;
    if ($instance === null) $instance = new StripeClient();
    return $instance;
}