# Miralo Frontend

Frontend de Miralo construido con Next.js (App Router), TypeScript y Tailwind CSS.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Arquitectura actual

- `src/app`: capas de ruteo y composición de layouts por grupos de rutas.
- `src/features`: módulos de dominio orientados por funcionalidad (ejemplo: auth).
- `src/components`: componentes reutilizables transversales.
- `src/store`: estado global de cliente con Zustand.
- `src/types`: contratos y declaraciones globales.

## Decisiones técnicas

- TypeScript en modo estricto (`strict: true`).
- Enfoque de separación por feature para escalar por dominios.
- App Router con layouts por grupos de rutas (`(app)` y `(auth)`).
- Componente de shell visual compartido para reducir duplicación de layout.

## Estado de autenticación

- Login con Google Identity Services integrado en frontend.
- Integración con backend de autenticación pendiente (microservicio en desarrollo).
- Se evita exponer tokens en consola o en mensajes de depuración.

## Criterios de calidad del proyecto

- Mantener tipado fuerte y evitar `any` en código de dominio.
- Evitar lógica duplicada en layouts y componentes de infraestructura.
- Preferir navegación declarativa (`next/link`) frente a `window.location`.
- Ejecutar `npm run lint` antes de abrir PR.

## Próximos pasos recomendados

- Conectar flujo de login a backend y gestionar sesión segura.
- Añadir pruebas unitarias para store y servicios de auth.
- Documentar convenciones de carpetas y nombrado para nuevos features.
