import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Packet = { from: number; to: number; t: number; speed: number; hue: 0 | 1 };

const CYAN = '53, 230, 208';
const VIOLET = '139, 108, 246';

const NODE_COUNT = 58;
const LINK_DIST = 168;
const MAX_PACKETS = 18;

/**
 * The hero backdrop: a drifting mesh of agents handing packets of work to each
 * other. It is the site's one literal illustration of what Wally builds, so it
 * earns its JavaScript — but it degrades to a single static frame under
 * reduced-motion, and never blocks paint.
 */
export default function MeshHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    const nodes: Node[] = [];
    const packets: Packet[] = [];
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.9,
        });
      }
    };

    /** Find a neighbour within linking distance so a packet has somewhere to go. */
    const neighbourOf = (i: number) => {
      const candidates: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) candidates.push(j);
      }
      return candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : -1;
    };

    const spawnPacket = () => {
      if (packets.length >= MAX_PACKETS) return;
      const from = Math.floor(Math.random() * nodes.length);
      const to = neighbourOf(from);
      if (to === -1) return;
      packets.push({
        from,
        to,
        t: 0,
        speed: 0.006 + Math.random() * 0.01,
        hue: Math.random() > 0.5 ? 1 : 0,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Edges, faded by distance so the mesh has depth.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.42;
          ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // Nodes brighten as the pointer approaches.
      for (const n of nodes) {
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 190);
        ctx.fillStyle = `rgba(${CYAN}, ${0.45 + near * 0.5})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + near * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Packets in flight — the handoff itself.
      for (const p of packets) {
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const eased = p.t * p.t * (3 - 2 * p.t);
        const x = a.x + (b.x - a.x) * eased;
        const y = a.y + (b.y - a.y) * eased;
        const rgb = p.hue ? VIOLET : CYAN;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 13);
        glow.addColorStop(0, `rgba(${rgb}, 0.85)`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${rgb}, 1)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].t += packets[i].speed;
        // On arrival the packet is handed onward rather than dying, so work
        // visibly moves through the mesh instead of blinking in and out.
        if (packets[i].t >= 1) {
          const next = neighbourOf(packets[i].to);
          if (next === -1 || Math.random() < 0.25) {
            packets.splice(i, 1);
          } else {
            packets[i] = { ...packets[i], from: packets[i].to, to: next, t: 0 };
          }
        }
      }

      if (Math.random() < 0.05) spawnPacket();

      draw();
      raf = requestAnimationFrame(step);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    resize();
    seed();

    if (reduced) {
      // One static frame: the mesh still reads as a mesh, nothing moves.
      draw();
    } else {
      for (let i = 0; i < 6; i++) spawnPacket();
      raf = requestAnimationFrame(step);
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    const onResize = () => {
      resize();
      seed();
      if (reduced) draw();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
