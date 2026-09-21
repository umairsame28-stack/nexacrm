'use client';

import { useEffect, useRef } from 'react';

/**
 * Subtle CRM Network Background
 * 
 * A sophisticated animated background showing the flow of CRM data:
 * - Sparse connection lines between nodes
 * - Small nodes representing contacts, leads, deals
 * - Occasional data flow animation along paths
 * - Respects prefers-reduced-motion
 * - Lightweight, CSS-first approach
 */

interface Node {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

interface Connection {
  from: Node;
  to: Node;
  curvature: number;
}

export function CRMNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Set canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Deterministic node positions (not random every render)
    const nodes: Node[] = [
      // Top area - sparse placement
      { x: 0.15, y: 0.2, size: 3, opacity: 0.15, delay: 0 },
      { x: 0.35, y: 0.15, size: 2.5, opacity: 0.12, delay: 2 },
      { x: 0.55, y: 0.25, size: 3.5, opacity: 0.18, delay: 4 },
      { x: 0.75, y: 0.18, size: 2, opacity: 0.1, delay: 6 },
      
      // Middle area
      { x: 0.2, y: 0.45, size: 2.5, opacity: 0.14, delay: 1 },
      { x: 0.45, y: 0.5, size: 3, opacity: 0.16, delay: 3 },
      { x: 0.7, y: 0.48, size: 2.8, opacity: 0.13, delay: 5 },
      { x: 0.85, y: 0.4, size: 2.2, opacity: 0.11, delay: 7 },
      
      // Lower area  
      { x: 0.25, y: 0.75, size: 2.8, opacity: 0.15, delay: 2 },
      { x: 0.5, y: 0.8, size: 2, opacity: 0.12, delay: 4 },
      { x: 0.8, y: 0.7, size: 3.2, opacity: 0.17, delay: 6 },
    ];

    // Define sparse connections (CRM pipeline flow)
    const connections: Connection[] = [
      { from: nodes[0], to: nodes[1], curvature: 0.3 },
      { from: nodes[1], to: nodes[2], curvature: -0.2 },
      { from: nodes[2], to: nodes[3], curvature: 0.4 },
      { from: nodes[0], to: nodes[4], curvature: 0.25 },
      { from: nodes[4], to: nodes[5], curvature: -0.15 },
      { from: nodes[5], to: nodes[6], curvature: 0.35 },
      { from: nodes[6], to: nodes[7], curvature: -0.25 },
      { from: nodes[4], to: nodes[8], curvature: 0.2 },
      { from: nodes[8], to: nodes[9], curvature: -0.3 },
      { from: nodes[9], to: nodes[10], curvature: 0.3 },
    ];

    // Get CSS color values
    const getColor = () => {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue('--primary').trim();
      return primary ? `hsl(${primary})` : '#6366f1';
    };

    let primaryColor = getColor();

    // Convert HSL to rgba with opacity
    const colorWithOpacity = (opacity: number) => {
      const hsl = primaryColor.match(/\d+/g);
      if (hsl) {
        return `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, ${opacity})`;
      }
      return `rgba(99, 102, 241, ${opacity})`;
    };

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      timeRef.current += 0.008; // Slow increment

      // Draw connections (curved lines)
      connections.forEach((conn, i) => {
        const fromX = conn.from.x * width;
        const fromY = conn.from.y * height;
        const toX = conn.to.x * width;
        const toY = conn.to.y * height;

        // Calculate control point for curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const controlX = midX - dy * conn.curvature;
        const controlY = midY + dx * conn.curvature;

        // Draw path
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(controlX, controlY, toX, toY);
        ctx.strokeStyle = colorWithOpacity(0.08);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Animate data flow dot along path (only if motion is allowed)
        if (!prefersReducedMotion) {
          const flowSpeed = 0.00015;
          const flowOffset = (timeRef.current * flowSpeed + i * 0.15) % 1;
          
          // Only show dot occasionally (not all the time)
          const showDot = Math.sin(timeRef.current * 0.5 + i * 2) > 0.7;
          
          if (showDot) {
            const t = flowOffset;
            // Quadratic bezier formula
            const flowX = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * controlX + t * t * toX;
            const flowY = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * controlY + t * t * toY;

            // Draw glowing dot
            ctx.beginPath();
            ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
            
            // Glow effect
            const gradient = ctx.createRadialGradient(flowX, flowY, 0, flowX, flowY, 8);
            gradient.addColorStop(0, colorWithOpacity(0.6));
            gradient.addColorStop(0.5, colorWithOpacity(0.3));
            gradient.addColorStop(1, colorWithOpacity(0));
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(flowX, flowY, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = colorWithOpacity(0.9);
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const x = node.x * width;
        const y = node.y * height;
        
        // Subtle pulse effect (only if motion is allowed)
        let pulseMultiplier = 1;
        if (!prefersReducedMotion) {
          const pulseSpeed = 0.0003;
          const pulse = Math.sin(timeRef.current * pulseSpeed + node.delay);
          pulseMultiplier = 1 + pulse * 0.2;
        }
        
        const size = node.size * pulseMultiplier;

        // Occasional illuminate effect
        let illuminateMultiplier = 1;
        if (!prefersReducedMotion) {
          const illuminateChance = Math.sin(timeRef.current * 0.0002 + node.delay * 3);
          if (illuminateChance > 0.92) {
            illuminateMultiplier = 1.8;
          }
        }

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        gradient.addColorStop(0, colorWithOpacity(node.opacity * 0.8 * illuminateMultiplier));
        gradient.addColorStop(0.5, colorWithOpacity(node.opacity * 0.3 * illuminateMultiplier));
        gradient.addColorStop(1, colorWithOpacity(0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = colorWithOpacity(node.opacity * illuminateMultiplier);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    if (!prefersReducedMotion) {
      animate();
    } else {
      // Static render for reduced motion
      animate();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
