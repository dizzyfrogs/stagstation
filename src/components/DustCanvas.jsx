import { useEffect, useRef } from 'react';

export default function DustCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    // hollow knight vibes - blues and purples
    const dustColors = [
      'rgba(138, 111, 168, 0.6)',
      'rgba(106, 76, 147, 0.5)',
      'rgba(74, 144, 226, 0.5)',
      'rgba(90, 159, 212, 0.4)',
      'rgba(157, 123, 184, 0.45)',
      'rgba(83, 52, 131, 0.4)',
      'rgba(58, 123, 200, 0.4)',
    ];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.25 - 0.08;
        this.vy = (Math.random() - 0.5) * 0.18;
        this.size = Math.random() * 2.5 + 0.8;
        this.color = dustColors[Math.floor(Math.random() * dustColors.length)];
        this.opacity = Math.random() * 0.4 + 0.3;
        this.driftX = (Math.random() - 0.5) * 0.04;
        this.driftY = (Math.random() - 0.5) * 0.025;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx += this.driftX * 0.008;
        this.vy += this.driftY * 0.008;
        this.vx *= 0.998;
        this.vy *= 0.998;

        // pulse effect
        this.pulsePhase += this.pulseSpeed;
        const pulse = Math.sin(this.pulsePhase) * 0.15 + 0.85;
        this.currentOpacity = this.opacity * pulse;

        if (Math.abs(this.vx) > 0.4) this.vx *= 0.92;
        if (Math.abs(this.vy) > 0.4) this.vy *= 0.92;

        if (this.x < 0) {
          this.x = canvas.width;
        } else if (this.x > canvas.width) {
          this.x = 0;
        }

        if (this.y < 0) {
          this.y = canvas.height;
        } else if (this.y > canvas.height) {
          this.y = 0;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.currentOpacity || this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // add glow
        ctx.shadowBlur = 3;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      // more particles = better
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000);

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="dust-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
