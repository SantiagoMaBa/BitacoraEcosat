"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function SignaturePad({
  inputName,
  height = 160,
}: {
  inputName: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [imagePng, setImagePng] = useState("");

  const size = useMemo(() => ({ width: 520, height }), [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * scale);
    canvas.height = Math.floor(size.height * scale);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    ctx.scale(scale, scale);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#101535";

    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "rgba(41, 52, 143, 0.02)";
    ctx.fillRect(0, 0, size.width, size.height);
  }, [size.height, size.width]);

  useEffect(() => {
    const canvasMaybe = canvasRef.current;
    if (!canvasMaybe) return;
    const canvasEl: HTMLCanvasElement = canvasMaybe;
    const ctxMaybe = canvasEl.getContext("2d");
    if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    function getPoint(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      return { x, y };
    }

    function onDown(event: PointerEvent) {
      drawing = true;
      canvasEl.setPointerCapture(event.pointerId);
      const p = getPoint(event);
      lastX = p.x;
      lastY = p.y;
    }

    function onMove(event: PointerEvent) {
      if (!drawing) return;
      const p = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x;
      lastY = p.y;
      setHasInk(true);
    }

    function onUp(event: PointerEvent) {
      drawing = false;
      try {
        canvasEl.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }

      try {
        const url = canvasEl.toDataURL("image/png");
        setImagePng(url);
      } catch {
        // ignore
      }
    }

    canvasEl.addEventListener("pointerdown", onDown);
    canvasEl.addEventListener("pointermove", onMove);
    canvasEl.addEventListener("pointerup", onUp);
    canvasEl.addEventListener("pointercancel", onUp);

    return () => {
      canvasEl.removeEventListener("pointerdown", onDown);
      canvasEl.removeEventListener("pointermove", onMove);
      canvasEl.removeEventListener("pointerup", onUp);
      canvasEl.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Repaint background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(41, 52, 143, 0.02)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasInk(false);
    setImagePng("");
  }

  return (
    <div className="signature-pad">
      <input type="hidden" name={inputName} value={imagePng} />
      <canvas ref={canvasRef} className="signature-canvas" />
      <div className="signature-actions">
        <button className="button button-secondary" type="button" onClick={clear}>
          Limpiar
        </button>
        <span className="muted">{hasInk ? "Firma lista" : "Dibuja tu firma"}</span>
      </div>
    </div>
  );
}
