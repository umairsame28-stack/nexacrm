'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'contact' | 'lead' | 'deal' | 'message' | 'task' | 'analytics';
  size: number;
  opacity: number;
  phase: number;
}

interface Connection {
  from: Node;
  to: Node;
  opacity: number;
  progress: number;
}

export function CRMMotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const [isReduced, setIsReduced] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check for mobile
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize nodes - CRM workflow stages
    const nodeCount = isMobile ? 20 : 35;
    const nodes: Node[] = [];
    
    const types: Node['type'][] = ['contact', 'lead', 'deal', 'message', 'task', 'analytics'];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        type: types[Math.floor(Math.random() * types.length)],
        size: isMobile ? 3 : 4,
        opacity: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
    
    nodesRef.current = nodes;

    // Create connections representing CRM data flow
    const connections: Connection[] = [];
    const maxConnections = isMobile ? 15 : 25;
    
    for (let i = 0; i < maxConnections; i++) {
      const from = nodes[Math.floor(Math.random() * nodes.length)];
      const to = nodes[Math.floor(Math.random() * nodes.length)];
      if (from !== to) {
        connections.push({
          from,
          to,
          opacity: 0.1 + Math.random() * 0.15,
          progress: Math.random(),
        });
      }
    }
    
    connectionsRef.current = connections;

    // Animation loop
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Clear canvas with dark background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw connections (data flow)
      connectionsRef.current.forEach((conn) => {
        const dx = conn.to.x - conn.from.x;
        const dy = conn.to.y - conn.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only draw if nodes are reasonably close
        if (dist < 200) {
          ctx.save();
          ctx.strokeStyle = `rgba(99, 102, 241, ${conn.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(conn.from.x, conn.from.y);
          ctx.lineTo(conn.to.x, conn.to.y);
          ctx.stroke();

          // Draw flowing particle along connection
          conn.progress += delta * 0.3;
          if (conn.progress > 1) conn.progress = 0;

          const px = conn.from.x + dx * conn.progress;
          const py = conn.from.y + dy * conn.progress;

          ctx.fillStyle = `rgba(139, 92, 246, ${conn.opacity * 2})`;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Update and draw nodes (contacts, leads, deals, etc.)
      nodesRef.current.forEach((node) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Pulse effect
        node.phase += delta * 2;
        const pulse = 0.8 + Math.sin(node.phase) * 0.2;

        // Draw node with type-specific styling
        ctx.save();
        
        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 3 * pulse);
        
        switch (node.type) {
          case 'contact':
            gradient.addColorStop(0, `rgba(99, 102, 241, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
            break;
          case 'lead':
            gradient.addColorStop(0, `rgba(139, 92, 246, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
            break;
          case 'deal':
            gradient.addColorStop(0, `rgba(16, 185, 129, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            break;
          case 'message':
            gradient.addColorStop(0, `rgba(59, 130, 246, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            break;
          case 'task':
            gradient.addColorStop(0, `rgba(245, 158, 11, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            break;
          case 'analytics':
            gradient.addColorStop(0, `rgba(236, 72, 153, ${node.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
            break;
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core node
        ctx.fillStyle = `rgba(99, 102, 241, ${node.opacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  }, [isReduced, isMobile]);

  if (isReduced) {
    // Static background for reduced motion
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020]" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#4F46E5]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#6366F1]/8 to-transparent rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <>
      {/* Dark cinematic base */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020]" />
      
      {/* Canvas motion layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Subtle atmospheric glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#4F46E5]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-[#8B5CF6]/5 rounded-full blur-3xl" />
      </div>
    </>
  );
}
