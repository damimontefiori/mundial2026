# Integración de reproductor AM 910 / La Red en una Web App Node.js + TSX

## 1. Objetivo

Este documento describe cómo integrar un reproductor de radio online para **AM 910 / La Red** dentro de una web app construida con **Node.js** y componentes **TSX**.

La implementación propuesta usa el objeto nativo `HTMLAudioElement` del navegador mediante `new Audio(...)`, evitando dependencias externas y manteniendo el reproductor simple, portable y fácil de testear.

---

## 2. Stream utilizado

URL directa del stream:

```ts
const STREAM_URL =
  "https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC";
```

Este stream corresponde a una transmisión AAC servida por StreamTheWorld.

---

## 3. Consideraciones técnicas importantes

### 3.1. El audio debe ejecutarse del lado cliente

El objeto `Audio` existe solamente en el navegador. No existe en Node.js puro ni durante el renderizado server-side.

Por eso, en frameworks como Next.js, Remix o cualquier entorno SSR, el reproductor debe inicializarse solamente del lado cliente.

En React/TSX, esto se resuelve usando:

```tsx
useRef<HTMLAudioElement | null>(null)
useEffect(...)
```

### 3.2. Autoplay policy

Los navegadores modernos bloquean reproducción automática de audio si no hay interacción del usuario.

Por eso, el stream debe iniciarse a partir de un evento explícito, por ejemplo:

```tsx
<button onClick={handleToggle}>
  Reproducir
</button>
```

No se recomienda intentar reproducir el stream automáticamente al cargar la página.

### 3.3. Stop real vs pausa

Para radio online, hacer solamente `audio.pause()` pausa el audio, pero puede mantener recursos asociados al stream.

Para detener de forma más limpia:

```ts
audio.pause();
audio.src = "";
audio.load();
```

Luego, cuando el usuario vuelve a reproducir, se vuelve a asignar la URL del stream.

---

## 4. Componente TSX recomendado

Archivo sugerido:

```txt
src/components/RadioPlayer.tsx
```

Código:

```tsx
import { useEffect, useRef, useState } from "react";

const STREAM_URL =
  "https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC";

type PlayerStatus =
  | "idle"
  | "connecting"
  | "playing"
  | "stopped"
  | "error";

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();

    audio.preload = "none";

    audio.addEventListener("playing", () => {
      setStatus("playing");
      setIsPlaying(true);
      setErrorMessage(null);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("error", () => {
      setStatus("error");
      setIsPlaying(false);
      setErrorMessage("No se pudo conectar con el stream.");
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const play = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      setStatus("connecting");
      setErrorMessage(null);

      audio.src = STREAM_URL;
      audio.load();

      await audio.play();
    } catch (error) {
      console.error("Error al reproducir el stream:", error);

      setStatus("error");
      setIsPlaying(false);
      setErrorMessage("El navegador no pudo reproducir el stream.");
    }
  };

  const stop = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.pause();
    audio.src = "";
    audio.load();

    setIsPlaying(false);
    setStatus("stopped");
  };

  const handleToggle = async () => {
    if (isPlaying) {
      stop();
    } else {
      await play();
    }
  };

  const statusLabel = {
    idle: "Detenido",
    connecting: "Conectando...",
    playing: "Reproduciendo en vivo",
    stopped: "Detenido",
    error: "Error de conexión",
  }[status];

  return (
    <section
      aria-label="Reproductor de radio AM 910 La Red"
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "320px",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.12)",
        textAlign: "center",
      }}
    >
      <h2 style={{ margin: "0 0 8px" }}>AM 910 - La Red</h2>

      <p style={{ margin: "0 0 20px", color: "#666" }}>
        Streaming en vivo
      </p>

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isPlaying}
        style={{
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          cursor: "pointer",
          background: isPlaying ? "#333333" : "#d71920",
          color: "#ffffff",
          fontSize: "16px",
        }}
      >
        {isPlaying ? "Stop" : "Reproducir"}
      </button>

      <p
        aria-live="polite"
        style={{
          marginTop: "16px",
          color: status === "error" ? "#b00020" : "#444",
        }}
      >
        {statusLabel}
      </p>

      {errorMessage && (
        <p style={{ color: "#b00020", fontSize: "14px" }}>
          {errorMessage}
        </p>
      )}
    </section>
  );
}
```

---

## 5. Uso del componente en una app React + Vite

Ejemplo:

```tsx
import { RadioPlayer } from "./components/RadioPlayer";

export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f3f3",
      }}
    >
      <RadioPlayer />
    </main>
  );
}
```

---

## 6. Uso del componente en Next.js App Router

En Next.js con App Router, el componente debe ser de cliente.

Archivo:

```txt
src/components/RadioPlayer.tsx
```

Agregar arriba de todo:

```tsx
"use client";
```

Ejemplo completo de importación en una página:

```tsx
import { RadioPlayer } from "@/components/RadioPlayer";

export default function HomePage() {
  return (
    <main>
      <RadioPlayer />
    </main>
  );
}
```

El componente quedaría así al inicio:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
```

Esto es necesario porque `Audio`, `window`, eventos del navegador y reproducción multimedia no existen durante el render del servidor.

---

## 7. Variante con CSS Module

Para evitar estilos inline, se puede usar un archivo CSS Module.

Estructura:

```txt
src/components/RadioPlayer.tsx
src/components/RadioPlayer.module.css
```

### RadioPlayer.module.css

```css
.player {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  text-align: center;
}

.title {
  margin: 0 0 8px;
}

.subtitle {
  margin: 0 0 20px;
  color: #666;
}

.button {
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  color: #ffffff;
  font-size: 16px;
}

.buttonPlay {
  background: #d71920;
}

.buttonStop {
  background: #333333;
}

.status {
  margin-top: 16px;
  color: #444;
}

.statusError {
  color: #b00020;
}

.error {
  color: #b00020;
  font-size: 14px;
}
```

### RadioPlayer.tsx usando CSS Module

```tsx
import { useEffect, useRef, useState } from "react";
import styles from "./RadioPlayer.module.css";

const STREAM_URL =
  "https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC";

type PlayerStatus =
  | "idle"
  | "connecting"
  | "playing"
  | "stopped"
  | "error";

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";

    const handlePlaying = () => {
      setStatus("playing");
      setIsPlaying(true);
      setErrorMessage(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setStatus("error");
      setIsPlaying(false);
      setErrorMessage("No se pudo conectar con el stream.");
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);

      audio.pause();
      audio.src = "";
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setStatus("connecting");
      setErrorMessage(null);

      audio.src = STREAM_URL;
      audio.load();

      await audio.play();
    } catch (error) {
      console.error("Error al reproducir el stream:", error);

      setStatus("error");
      setIsPlaying(false);
      setErrorMessage("El navegador no pudo reproducir el stream.");
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = "";
    audio.load();

    setIsPlaying(false);
    setStatus("stopped");
  };

  const handleToggle = async () => {
    if (isPlaying) {
      stop();
    } else {
      await play();
    }
  };

  const statusLabel = {
    idle: "Detenido",
    connecting: "Conectando...",
    playing: "Reproduciendo en vivo",
    stopped: "Detenido",
    error: "Error de conexión",
  }[status];

  return (
    <section
      className={styles.player}
      aria-label="Reproductor de radio AM 910 La Red"
    >
      <h2 className={styles.title}>AM 910 - La Red</h2>

      <p className={styles.subtitle}>Streaming en vivo</p>

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isPlaying}
        className={[
          styles.button,
          isPlaying ? styles.buttonStop : styles.buttonPlay,
        ].join(" ")}
      >
        {isPlaying ? "Stop" : "Reproducir"}
      </button>

      <p
        aria-live="polite"
        className={[
          styles.status,
          status === "error" ? styles.statusError : "",
        ].join(" ")}
      >
        {statusLabel}
      </p>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
    </section>
  );
}
```

---

## 8. Variante usando variable de entorno

Para no hardcodear el stream en el componente, se puede mover la URL a una variable de entorno.

### Vite

Archivo `.env`:

```env
VITE_RADIO_STREAM_URL=https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC
```

Uso en TSX:

```ts
const STREAM_URL = import.meta.env.VITE_RADIO_STREAM_URL;
```

### Next.js

Archivo `.env.local`:

```env
NEXT_PUBLIC_RADIO_STREAM_URL=https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC
```

Uso en TSX:

```ts
const STREAM_URL = process.env.NEXT_PUBLIC_RADIO_STREAM_URL;
```

Validación recomendada:

```ts
if (!STREAM_URL) {
  throw new Error("Falta configurar la variable de entorno del stream.");
}
```

Importante: la URL del stream es pública porque se ejecuta en el navegador. Por eso, la variable debe ser pública en el caso de Next.js mediante el prefijo `NEXT_PUBLIC_`.

---

## 9. Integración con backend Node.js

Para este caso no es necesario que Node.js actúe como proxy del audio.

La arquitectura recomendada es:

```txt
Browser / React TSX
        |
        | reproduce directamente
        v
StreamTheWorld / LA_RED_AM910AAC_SC
```

Node.js puede intervenir solamente para:

- servir la app;
- exponer configuración;
- registrar métricas propias;
- validar si el stream está disponible;
- devolver una lista de radios si la app escala a múltiples emisoras.

No se recomienda proxyear el audio desde Node.js salvo que exista una necesidad concreta, porque aumenta consumo de ancho de banda, latencia y complejidad operativa.

---

## 10. Endpoint opcional de configuración en Node.js

Si se quiere centralizar la URL del stream en backend, se puede crear un endpoint simple.

### Express

```ts
import express from "express";

const app = express();

app.get("/api/radio/la-red", (_req, res) => {
  res.json({
    name: "AM 910 - La Red",
    streamUrl:
      "https://playerservices.streamtheworld.com/api/livestream-redirect/LA_RED_AM910AAC_SC",
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Consumo desde TSX

```tsx
type RadioConfig = {
  name: string;
  streamUrl: string;
};

async function getRadioConfig(): Promise<RadioConfig> {
  const response = await fetch("/api/radio/la-red");

  if (!response.ok) {
    throw new Error("No se pudo obtener la configuración de radio.");
  }

  return response.json();
}
```

Uso en el componente:

```tsx
const config = await getRadioConfig();

audio.src = config.streamUrl;
audio.load();

await audio.play();
```

---

## 11. Manejo de errores recomendado

El reproductor debería contemplar estos escenarios:

| Escenario | Manejo recomendado |
|---|---|
| El usuario presiona reproducir y falla | Mostrar mensaje visible |
| El navegador bloquea reproducción | Iniciar solo desde click del usuario |
| El stream no responde | Pasar estado a `error` |
| El usuario cambia de página | Limpiar audio en `useEffect` cleanup |
| El usuario presiona stop | Pausar, limpiar `src` y llamar `load()` |
| Se pierde la conexión | Escuchar evento `error` del audio |

---

## 12. Accesibilidad mínima

Recomendaciones:

```tsx
<section aria-label="Reproductor de radio AM 910 La Red">
```

```tsx
<button aria-pressed={isPlaying}>
```

```tsx
<p aria-live="polite">
  {statusLabel}
</p>
```

Esto permite que lectores de pantalla informen correctamente el estado del reproductor.

---

## 13. Testing manual

Checklist básico:

1. Abrir la web app.
2. Verificar que el estado inicial sea `Detenido`.
3. Presionar `Reproducir`.
4. Verificar que el estado pase a `Conectando...`.
5. Verificar que luego pase a `Reproduciendo en vivo`.
6. Presionar `Stop`.
7. Verificar que el audio se corte.
8. Volver a presionar `Reproducir`.
9. Verificar que reconecte correctamente.
10. Probar en Chrome, Edge y Firefox.
11. Probar en mobile, especialmente Android Chrome y Safari iOS.

---

## 14. Posibles mejoras futuras

- Agregar control de volumen.
- Mostrar indicador visual de conexión.
- Agregar retry automático con límite.
- Agregar soporte para múltiples radios.
- Guardar preferencia de volumen en `localStorage`.
- Agregar telemetría de eventos: `play`, `stop`, `error`.
- Agregar fallback de stream si el principal falla.
- Agregar integración con Media Session API para controles del sistema operativo.

---

## 15. Ejemplo con control de volumen

```tsx
const [volume, setVolume] = useState(1);

const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const nextVolume = Number(event.target.value);

  setVolume(nextVolume);

  if (audioRef.current) {
    audioRef.current.volume = nextVolume;
  }
};
```

Input:

```tsx
<label>
  Volumen
  <input
    type="range"
    min="0"
    max="1"
    step="0.01"
    value={volume}
    onChange={handleVolumeChange}
  />
</label>
```

---

## 16. Resumen de integración recomendada

La solución recomendada es:

1. Crear un componente `RadioPlayer.tsx`.
2. Inicializar `Audio` en `useEffect`.
3. Guardar la instancia en `useRef`.
4. Iniciar reproducción solo ante click del usuario.
5. Manejar estados: `idle`, `connecting`, `playing`, `stopped`, `error`.
6. Detener limpiando `src` y llamando `load()`.
7. Liberar recursos al desmontar el componente.
8. No usar Node.js como proxy salvo necesidad específica.

Esta arquitectura mantiene el reproductor simple, eficiente y compatible con una web app moderna basada en Node.js y TSX.
