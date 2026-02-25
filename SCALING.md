# Guia de Autoscaling — DropStore Platform

Este documento descreve as otimizações de escalabilidade implementadas no código e as recomendações de infraestrutura para suportar **10 000+ utilizadores simultâneos**.

---

## 1. Arquitetura Recomendada

```
Internet
    │
    ▼
┌─────────────────────────────────────────┐
│  CDN (Cloudflare / CloudFront)          │
│  • Assets estáticos com cache de 1 ano  │
│  • DDoS protection                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Load Balancer (AWS ALB / Nginx)        │
│  • Round-robin entre pods               │
│  • Health check: GET /api/health        │
│  • X-Forwarded-For passthrough          │
└────────┬────────────────────────────────┘
         │
    ┌────┴─────────────────────┐
    ▼                          ▼
┌────────┐               ┌────────┐
│ Pod 1  │  ...  N pods  │ Pod N  │
│ Node   │               │ Node   │
│ :3000  │               │ :3000  │
└────┬───┘               └────┬───┘
     └──────────┬─────────────┘
                ▼
┌─────────────────────────────────────────┐
│  TiDB / MySQL (managed, multi-AZ)       │
│  • Connection pool: 20 conn/pod         │
│  • Índices em: slug, userId, storeId    │
└─────────────────────────────────────────┘
```

---

## 2. Otimizações Implementadas no Código

### 2.1 Servidor Stateless

O servidor não guarda qualquer estado em memória entre pedidos. A autenticação é feita exclusivamente através de **JWT assinados** armazenados em cookies `HttpOnly`. Qualquer número de pods pode processar qualquer pedido sem necessidade de sticky sessions.

### 2.2 Connection Pooling

O ficheiro `server/db.ts` inicializa um **pool de conexões MySQL** partilhado por todos os pedidos dentro do mesmo processo:

| Parâmetro | Valor | Justificação |
|---|---|---|
| `connectionLimit` | 20 | Equilibra throughput e carga no servidor de BD |
| `queueLimit` | 100 | Evita rejeições abruptas em picos de tráfego |
| `waitForConnections` | `true` | Faz queue em vez de falhar imediatamente |
| `enableKeepAlive` | `true` | Reduz latência de reconexão |

Com 10 pods a 20 conexões cada, o servidor de base de dados recebe no máximo **200 conexões simultâneas** — dentro dos limites típicos de TiDB/MySQL gerido.

### 2.3 Cache em Processo (LRU)

O módulo `server/cache.ts` implementa um cache LRU em memória para dados de leitura frequente:

| Cache | Entradas máx. | TTL | Dados |
|---|---|---|---|
| `userCache` | 5 000 | 30 s | Registos de utilizadores autenticados |
| `storeCache` | 2 000 | 60 s | Lojas públicas (vitrine) |

O TTL curto garante que mutações (ex: atualização de loja) se propagam em segundos, sem necessidade de invalidação cross-pod. Em caso de deploy com dezenas de pods, considerar migrar para **Redis** como cache partilhado.

### 2.4 Rate Limiting

O módulo `server/rateLimiter.ts` protege os endpoints com três níveis:

| Limiter | Endpoints | Limite | Janela |
|---|---|---|---|
| `authLimiter` | `/api/trpc/auth.login`, `/api/trpc/auth.register` | 20 tentativas falhadas | 15 min |
| `apiLimiter` | `/api/trpc/*` | 300 pedidos | 1 min |
| `publicLimiter` | Disponível para rotas públicas | 600 pedidos | 1 min |

Os contadores são por-pod (em memória). Para rate limiting global entre pods, substituir o `MemoryStore` por `rate-limit-redis`.

### 2.5 Compressão HTTP

`compression` (gzip/deflate) está ativo para todas as respostas com mais de 1 KB. Em produção, delegar a compressão ao **Nginx** ou **CDN** para poupar CPU no Node.js.

### 2.6 Headers de Segurança

`helmet` adiciona automaticamente os seguintes headers em todos os pedidos:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`

### 2.7 Cache de Assets Estáticos

Em produção, os assets gerados pelo Vite (com hash no nome) são servidos com `Cache-Control: max-age=31536000, immutable`. O `index.html` é sempre servido sem cache (`no-cache, no-store`).

### 2.8 Health Check

`GET /api/health` responde com HTTP 200 e o seguinte payload:

```json
{
  "status": "ok",
  "timestamp": "2026-02-25T19:00:00.000Z",
  "uptime": 3600.5
}
```

Configurar o load balancer para verificar este endpoint a cada 10–30 segundos. Um pod que não responda em 5 s deve ser removido da rotação.

### 2.9 Graceful Shutdown

O servidor escuta `SIGTERM` e `SIGINT`. Ao receber o sinal:

1. Para de aceitar novas conexões.
2. Aguarda que os pedidos em curso terminem.
3. Força saída após 10 segundos (timeout de segurança).

Isto permite que o orquestrador (Kubernetes, ECS) drene o tráfego antes de terminar o pod.

---

## 3. Configuração de Infraestrutura

### 3.1 Variáveis de Ambiente por Pod

Nenhuma variável adicional é necessária. As variáveis existentes (`DATABASE_URL`, `JWT_SECRET`, etc.) são injetadas pela plataforma e são seguras para múltiplos pods.

### 3.2 Dimensionamento Recomendado

| Utilizadores simultâneos | Pods | CPU/pod | RAM/pod |
|---|---|---|---|
| até 1 000 | 2 | 0.5 vCPU | 512 MB |
| até 5 000 | 4 | 1 vCPU | 1 GB |
| até 10 000 | 8 | 1 vCPU | 1 GB |
| 10 000+ | autoscale | 2 vCPU | 2 GB |

### 3.3 Autoscaling Horizontal (HPA — Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dropstore-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dropstore
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

### 3.4 Próximos Passos para Escala Maior (100k+)

Para escalar além de 10 000 utilizadores simultâneos, as seguintes melhorias são recomendadas:

1. **Redis** como cache partilhado entre pods (substituir `server/cache.ts`).
2. **Redis** como store para rate limiting global (substituir `MemoryStore` no `rateLimiter.ts`).
3. **CDN para API responses** — respostas públicas (vitrine) podem ser cacheadas no Cloudflare com `Cache-Control: public, max-age=60`.
4. **Read replicas** na base de dados para distribuir queries de leitura.
5. **Queue de trabalho** (BullMQ + Redis) para operações pesadas (envio de emails, geração de imagens).

---

*Documento gerado automaticamente em 25/02/2026.*
