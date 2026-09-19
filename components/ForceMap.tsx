"use client";

import { useEffect, useMemo, useRef } from "react";
import { DEPARTMENT_COLOURS } from "@/lib/departments";
import type { Edge, Highlight, Person, Workplace } from "@/lib/types";

type SimNode = Person & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Camera = { x: number; y: number; scale: number };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function hitNode(nodes: SimNode[], worldX: number, worldY: number) {
  let best: SimNode | null = null;
  let bestDist = 18;
  for (const node of nodes) {
    const dx = node.x - worldX;
    const dy = node.y - worldY;
    const dist = Math.hypot(dx, dy);
    const radius = node.you ? 16 : 12;
    if (dist < radius + 4 && dist < bestDist) {
      best = node;
      bestDist = dist;
    }
  }
  return best;
}

export function ForceMap({
  workplace,
  highlight,
  selectedId,
  onSelect,
  hoverId,
  onHover,
}: {
  workplace: Workplace;
  highlight: Highlight | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{
    mode: "node" | "pan";
    id?: string;
    lastX: number;
    lastY: number;
  } | null>(null);
  const highlightRef = useRef(highlight);
  const selectedRef = useRef(selectedId);
  const hoverRef = useRef(hoverId);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);

  highlightRef.current = highlight;
  selectedRef.current = selectedId;
  hoverRef.current = hoverId;
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;

  const peopleKey = useMemo(
    () => workplace.people.map((person) => person.id).join(","),
    [workplace.people],
  );

  useEffect(() => {
    const width = 1200;
    const height = 800;
    const departments = [...new Set(workplace.people.map((person) => person.department))];
    nodesRef.current = workplace.people.map((person, index) => {
      const deptIndex = departments.indexOf(person.department);
      const angle = (deptIndex / Math.max(departments.length, 1)) * Math.PI * 2;
      const radius = person.you ? 40 : 220 + (index % 5) * 18;
      return {
        ...person,
        x: width / 2 + Math.cos(angle) * radius + (index % 7) * 8,
        y: height / 2 + Math.sin(angle) * radius + (index % 5) * 10,
        vx: 0,
        vy: 0,
      };
    });
    cameraRef.current = { x: 0, y: 0, scale: 1 };
  }, [peopleKey, workplace.people]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;
      const w = parent?.clientWidth ?? 800;
      const h = parent?.clientHeight ?? 600;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const cam = cameraRef.current;
      return {
        x: (clientX - rect.left - cam.x) / cam.scale,
        y: (clientY - rect.top - cam.y) / cam.scale,
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      const world = toWorld(event.clientX, event.clientY);
      const node = hitNode(nodesRef.current, world.x, world.y);
      if (node) {
        dragRef.current = {
          mode: "node",
          id: node.id,
          lastX: world.x,
          lastY: world.y,
        };
        onSelectRef.current(node.id);
      } else {
        dragRef.current = {
          mode: "pan",
          lastX: event.clientX,
          lastY: event.clientY,
        };
      }
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const world = toWorld(event.clientX, event.clientY);
      const hovering = hitNode(nodesRef.current, world.x, world.y);
      onHoverRef.current(hovering?.id ?? null);
      canvas.style.cursor = hovering ? "pointer" : dragRef.current ? "grabbing" : "grab";

      const drag = dragRef.current;
      if (!drag) return;
      if (drag.mode === "node" && drag.id) {
        const node = nodesRef.current.find((entry) => entry.id === drag.id);
        if (node) {
          node.x = world.x;
          node.y = world.y;
          node.vx = 0;
          node.vy = 0;
        }
      } else {
        cameraRef.current.x += event.clientX - drag.lastX;
        cameraRef.current.y += event.clientY - drag.lastY;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      dragRef.current = null;
      canvas.releasePointerCapture(event.pointerId);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const cam = cameraRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const worldX = (mx - cam.x) / cam.scale;
      const worldY = (my - cam.y) / cam.scale;
      const next = Math.min(2.2, Math.max(0.45, cam.scale * (event.deltaY > 0 ? 0.92 : 1.08)));
      cam.scale = next;
      cam.x = mx - worldX * next;
      cam.y = my - worldY * next;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", () => onHoverRef.current(null));
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const tick = () => {
      if (!running) return;
      const nodes = nodesRef.current;
      const edges = workplace.edges;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const minDist = a.department === b.department ? 56 : 78;
          if (dist < minDist) {
            const force = ((minDist - dist) / minDist) * 0.12;
            dx /= dist;
            dy /= dist;
            a.vx += dx * force;
            a.vy += dy * force;
            b.vx -= dx * force;
            b.vy -= dy * force;
          } else if (dist < 220) {
            const force = 0.015 / dist;
            dx /= dist;
            dy /= dist;
            a.vx += dx * force * 8;
            a.vy += dy * force * 8;
            b.vx -= dx * force * 8;
            b.vy -= dy * force * 8;
          }
        }
      }

      const byId = new Map(nodes.map((node) => [node.id, node]));
      for (const edge of edges) {
        const a = byId.get(edge.source);
        const b = byId.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const rest = edge.kind === "reports" ? 90 : edge.kind === "weak" ? 170 : 120;
        const k = 0.004 + edge.strength * 0.0018;
        const force = (dist - rest) * k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      const deptCenters = new Map<string, { x: number; y: number; n: number }>();
      for (const node of nodes) {
        const current = deptCenters.get(node.department) ?? { x: 0, y: 0, n: 0 };
        current.x += node.x;
        current.y += node.y;
        current.n += 1;
        deptCenters.set(node.department, current);
      }

      for (const node of nodes) {
        const center = deptCenters.get(node.department);
        if (center && center.n > 1) {
          node.vx += ((center.x / center.n - node.x) * 0.008);
          node.vy += ((center.y / center.n - node.y) * 0.008);
        }
        node.vx += (w / 2 - node.x) * 0.002;
        node.vy += (h / 2 - node.y) * 0.002;
        if (node.you) {
          node.vx += (w / 2 - node.x) * 0.01;
          node.vy += (h / 2 - node.y) * 0.01;
        }
        if (dragRef.current?.mode === "node" && dragRef.current.id === node.id) {
          node.vx = 0;
          node.vy = 0;
        } else {
          node.vx *= 0.82;
          node.vy *= 0.82;
          node.x += node.vx;
          node.y += node.vy;
        }
      }

      draw(ctx, w, h, nodes, edges);
      frame = requestAnimationFrame(tick);
    };

    const draw = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number,
      nodes: SimNode[],
      edges: Edge[],
    ) => {
      const cam = cameraRef.current;
      const highlightIds = new Set(highlightRef.current?.nodeIds ?? []);
      const highlightEdges = new Set(highlightRef.current?.edgeIds ?? []);
      const selected = selectedRef.current;
      const hover = hoverRef.current;

      context.clearRect(0, 0, w, h);
      context.save();
      context.translate(cam.x, cam.y);
      context.scale(cam.scale, cam.scale);

      const byId = new Map(nodes.map((node) => [node.id, node]));
      for (const edge of edges) {
        const a = byId.get(edge.source);
        const b = byId.get(edge.target);
        if (!a || !b) continue;
        const active =
          highlightEdges.has(edge.id) ||
          (highlightIds.size > 1 &&
            highlightIds.has(edge.source) &&
            highlightIds.has(edge.target));
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = active
          ? "rgba(212, 137, 90, 0.95)"
          : edge.kind === "weak"
            ? "rgba(154, 168, 159, 0.28)"
            : "rgba(74, 163, 146, 0.35)";
        context.lineWidth = active ? 2.4 : Math.max(0.7, edge.strength * 0.35);
        if (edge.kind === "weak" && !active) context.setLineDash([5, 5]);
        else context.setLineDash([]);
        context.stroke();
        context.setLineDash([]);
      }

      for (const node of nodes) {
        const colour = DEPARTMENT_COLOURS[node.department];
        const radius = node.you ? 16 : node.tags?.includes("broker") ? 12 : 10;
        const isSel = node.id === selected || node.id === hover || highlightIds.has(node.id);

        if (node.you) {
          context.beginPath();
          context.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
          context.strokeStyle = "rgba(74, 163, 146, 0.85)";
          context.lineWidth = 2;
          context.stroke();
        }
        if (node.tags?.includes("broker")) {
          context.beginPath();
          context.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
          context.strokeStyle = "rgba(212, 137, 90, 0.9)";
          context.lineWidth = 1.6;
          context.stroke();
        }
        if (node.tags?.includes("fold")) {
          context.beginPath();
          context.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          context.strokeStyle = "rgba(155, 142, 196, 0.7)";
          context.setLineDash([3, 3]);
          context.stroke();
          context.setLineDash([]);
        }

        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fillStyle = colour;
        context.globalAlpha = isSel || !highlightIds.size ? 1 : 0.35;
        context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = isSel ? "#f3efe4" : "rgba(15, 22, 20, 0.55)";
        context.lineWidth = isSel ? 2 : 1;
        context.stroke();

        context.fillStyle = node.department === "Leadership" ? "#0f1614" : "#0f1614";
        if (node.department === "Leadership") context.fillStyle = "#0f1614";
        context.font = `${node.you ? 10 : 9}px Sora, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(initials(node.name), node.x, node.y + 0.5);

        const showLabel =
          node.you ||
          isSel ||
          node.tags?.includes("broker") ||
          highlightIds.has(node.id);
        if (showLabel) {
          context.font = `${node.you ? 12 : 11}px Sora, sans-serif`;
          context.fillStyle = "#f3efe4";
          context.textBaseline = "top";
          context.fillText(node.you ? `${node.name} (you)` : node.name, node.x, node.y + radius + 6);
        }
      }

      context.restore();

      if (highlightRef.current?.label) {
        context.fillStyle = "rgba(24, 33, 30, 0.92)";
        context.fillRect(16, 16, Math.min(420, w - 32), 36);
        context.strokeStyle = "rgba(212, 137, 90, 0.7)";
        context.strokeRect(16, 16, Math.min(420, w - 32), 36);
        context.fillStyle = "#f3efe4";
        context.font = "12px Sora, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(highlightRef.current.label, 28, 34);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [peopleKey, workplace.edges]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none rounded-2xl bg-[#101816]"
      aria-label="Workplace network map"
    />
  );
}
