# Miralo Frontend

Frontend de Miralo construido con Next.js (App Router), TypeScript y Tailwind CSS.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Configuración local

1. Variables de entorno:

```bash
cp .env.example .env.local
```

2. En local, usa el backend de auth en puerto 3001:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3001
```

3. Levanta el backend-auth y luego el frontend.

## Flujo de autenticación local

- El botón "Continue with Google" navega a `GET /auth/google` en `NEXT_PUBLIC_API_GATEWAY_URL`.
- Google redirige al backend-auth en `/auth/google/callback`.
- El backend-auth redirige al frontend en `/auth/google/callback?token=...`.
- El frontend valida el token con `GET /auth/me` y persiste la sesión en Zustand + localStorage.

## Arquitectura actual

- `src/app`: capas de ruteo y layouts por grupos de rutas.
- `src/features`: módulos por dominio (ejemplo: auth).
- `src/components`: componentes reutilizables transversales.
- `src/store`: estado global de cliente con Zustand.
- `src/types`: contratos y declaraciones globales.

## Criterios de calidad

- Mantener tipado fuerte y evitar `any` en código de dominio.
- Evitar lógica duplicada en layouts y componentes de infraestructura.
- Ejecutar `npm run lint` antes de abrir PR.

## Estado actual

- Login con Google conectado al backend-auth.
- Manejo de token por query param y sincronización automática de sesión.
- Compatible con ejecución local sin depender de redirecciones a producción.
