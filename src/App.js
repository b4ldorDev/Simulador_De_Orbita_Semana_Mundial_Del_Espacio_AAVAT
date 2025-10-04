import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Info } from 'lucide-react';

const OrbitalSimulator = () => {
  const canvasRef = useRef(null);
  const [velocity, setVelocity] = useState(5);
  const [angle, setAngle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasAtmosphere, setHasAtmosphere] = useState(false);
  const [result, setResult] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  
  const animationRef = useRef(null);
  const projectileRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, trail: [] });

  // Constantes
  const EARTH_RADIUS = 150;
  const CANNON_HEIGHT = 50;
  const GRAVITY = 0.15;
  const AIR_RESISTANCE = 0.98;
  //const ORBITAL_VELOCITY = 7.66;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const drawEarth = () => {
      // Tierra
      ctx.beginPath();
      ctx.arc(centerX, centerY, EARTH_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#4A90E2';
      ctx.fill();
      
      // Continentes simplificados
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(centerX - 40, centerY - 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 50, centerY + 20, 25, 0, Math.PI * 2);
      ctx.fill();

      // Atmósfera si está activada
      if (hasAtmosphere) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, EARTH_RADIUS + 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.lineWidth = 10;
        ctx.stroke();
      }
    };

    const drawCannon = () => {
      const cannonAngle = (angle * Math.PI) / 180;
      const cannonX = centerX + (EARTH_RADIUS + CANNON_HEIGHT) * Math.cos(cannonAngle - Math.PI / 2);
      const cannonY = centerY + (EARTH_RADIUS + CANNON_HEIGHT) * Math.sin(cannonAngle - Math.PI / 2);

      // Base del cañón
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#424242';
      ctx.fill();

      // Tubo del cañón
      const cannonLength = 25;
      const endX = cannonX + cannonLength * Math.cos(cannonAngle);
      const endY = cannonY + cannonLength * Math.sin(cannonAngle);
      
      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 6;
      ctx.stroke();
    };

    const drawProjectile = () => {
      const p = projectileRef.current;
      
      // Estela
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < p.trail.length; i++) {
        const point = p.trail[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();

      // Proyectil
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const updatePhysics = () => {
      const p = projectileRef.current;
      
      // Distancia al centro de la Tierra
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Vector de gravedad normalizado
      const gravX = (-dx / distance) * GRAVITY;
      const gravY = (-dy / distance) * GRAVITY;

      // Aplicar gravedad
      p.vx += gravX;
      p.vy += gravY;

      // Resistencia del aire si está activada
      if (hasAtmosphere && distance < EARTH_RADIUS + 50) {
        p.vx *= AIR_RESISTANCE;
        p.vy *= AIR_RESISTANCE;
      }

      // Actualizar posición
      p.x += p.vx;
      p.y += p.vy;

      // Agregar a la estela
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 150) {
        p.trail.shift();
      }

      // Verificar colisión con la Tierra
      if (distance < EARTH_RADIUS) {
        setResult('¡IMPACTO! La bala cayó a la Tierra 🌍');
        setIsRunning(false);
        return false;
      }

      // Verificar escape
      if (distance > canvas.width / 2 + 100) {
        setResult('¡ESCAPE! La bala escapó al espacio ');
        setIsRunning(false);
        return false;
      }

      // Verificar órbita (ha dado casi una vuelta completa)
      if (p.trail.length > 200) {
        const firstPoint = p.trail[0];
        const dist = Math.sqrt((p.x - firstPoint.x) ** 2 + (p.y - firstPoint.y) ** 2);
        if (dist < 30) {
          const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const orbitQuality = Math.abs(distance - (EARTH_RADIUS + CANNON_HEIGHT));
          
          if (orbitQuality < 10) {
            setResult(`¡ÓRBITA PERFECTA!  Velocidad: ${(currentSpeed * 1.5).toFixed(2)} km/s`);
          } else if (orbitQuality < 30) {
            setResult(`¡ÓRBITA ESTABLE!  Velocidad: ${(currentSpeed * 1.5).toFixed(2)} km/s`);
          } else {
            setResult(`Órbita elíptica  Velocidad: ${(currentSpeed * 1.5).toFixed(2)} km/s`);
          }
          setIsRunning(false);
          return false;
        }
      }

      return true;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawEarth();
      drawCannon();
      
      if (isRunning) {
        const continueAnimation = updatePhysics();
        drawProjectile();
        
        if (continueAnimation) {
          animationRef.current = requestAnimationFrame(animate);
        }
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, angle, hasAtmosphere]);

  const startSimulation = () => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const cannonAngle = (angle * Math.PI) / 180;
    const startX = centerX + (EARTH_RADIUS + CANNON_HEIGHT) * Math.cos(cannonAngle - Math.PI / 2);
    const startY = centerY + (EARTH_RADIUS + CANNON_HEIGHT) * Math.sin(cannonAngle - Math.PI / 2);
    
    const speed = velocity * 0.8;
    
    projectileRef.current = {
      x: startX,
      y: startY,
      vx: speed * Math.cos(cannonAngle),
      vy: speed * Math.sin(cannonAngle),
      trail: []
    };
    
    setResult('');
    setIsRunning(true);
  };

  const reset = () => {
    setIsRunning(false);
    projectileRef.current = { x: 0, y: 0, vx: 0, vy: 0, trail: [] };
    setResult('');
  };

  const getVelocityCategory = () => {
    if (velocity < 3) return { text: 'Muy lenta - Caerá rápido', color: 'text-red-500' };
    if (velocity < 5) return { text: 'Lenta - Trayectoria parabólica', color: 'text-orange-500' };
    if (velocity < 6.5) return { text: 'Media - Órbita elíptica', color: 'text-yellow-500' };
    if (velocity < 8) return { text: '¡Velocidad orbital! ', color: 'text-green-500' };
    return { text: 'Muy rápida - Puede escapar', color: 'text-blue-500' };
  };

  const velocityInfo = getVelocityCategory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            🚀 Simulador de Disparo Orbital
          </h1>
          <p className="text-xl text-purple-200">
            Descubre cómo funcionan las órbitas: la ciencia de caerse sin tocar el suelo
          </p>
        </div>

        {showInfo && (
          <div className="bg-blue-900/40 border border-blue-400 rounded-lg p-4 mb-6 backdrop-blur">
            <div className="flex items-start gap-3">
              <Info className="text-blue-300 mt-1 flex-shrink-0" size={24} />
              <div className="text-blue-100">
                <p className="font-semibold mb-2">¿ Cómo funciona:</p>
                <ul className="text-sm space-y-1">
                  <li>• Ajusta la <strong>velocidad</strong> y el <strong>ángulo</strong> del disparo</li>
                  <li>• Velocidad orbital ideal: ~7.66 km/s (similar a la ISS)</li>
                  <li>• Activa la atmósfera para ver cómo el aire frena la bala</li>
                  <li>• ¡Intenta conseguir una órbita perfecta! 🎯</li>
                </ul>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="mt-3 text-xs text-blue-300 hover:text-blue-100 underline"
                >
                  Cerrar ayuda
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-900/80 rounded-xl p-6 backdrop-blur border border-purple-500/30">
              <canvas
                ref={canvasRef}
                width={700}
                height={700}
                className="w-full border-2 border-purple-500/50 rounded-lg"
                style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #0a0a0f 100%)' }}
              />
              
              {result && (
                <div className="mt-4 p-4 bg-purple-600/30 border border-purple-400 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{result}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900/80 rounded-xl p-6 backdrop-blur border border-purple-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">⚙️ Controles</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Velocidad: {(velocity * 1.5).toFixed(2)} km/s
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={velocity}
                    onChange={(e) => setVelocity(parseFloat(e.target.value))}
                    disabled={isRunning}
                    className="w-full h-3 bg-purple-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className={`text-sm mt-2 font-medium ${velocityInfo.color}`}>
                    {velocityInfo.text}
                  </p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Ángulo: {angle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    disabled={isRunning}
                    className="w-full h-3 bg-purple-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-800/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="atmosphere"
                    checked={hasAtmosphere}
                    onChange={(e) => setHasAtmosphere(e.target.checked)}
                    disabled={isRunning}
                    className="w-5 h-5 accent-purple-500"
                  />
                  <label htmlFor="atmosphere" className="text-white font-medium">
                    Activar atmósfera 🌫️
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={startSimulation}
                    disabled={isRunning}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Play size={20} />
                    Disparar
                  </button>
                  
                  <button
                    onClick={reset}
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-xl p-6 backdrop-blur border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-3">📊 Datos de referencia</h3>
              <div className="space-y-2 text-sm text-purple-200">
                <p><strong>ISS:</strong> 7.66 km/s a 400 km</p>
                <p><strong>Órbita baja:</strong> 7-8 km/s</p>
                <p><strong>Escape:</strong> &gt;11 km/s</p>
                <p className="pt-2 text-xs italic">
                  Velocidad de escape: velocidad necesaria para abandonar completamente la órbita terrestre
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-purple-900/30 rounded-xl p-6 backdrop-blur border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-3">🎯 Conceptos clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-purple-100">
            <div>
              <p className="font-semibold text-purple-300">Caída lenta:</p>
              <p className="text-sm">La bala describe una parábola y cae al suelo. Sin velocidad suficiente no hay órbita.</p>
            </div>
            <div>
              <p className="font-semibold text-green-300">Velocidad orbital:</p>
              <p className="text-sm">La bala cae al mismo ritmo que la superficie se aleja. ¡Órbita conseguida!</p>
            </div>
            <div>
              <p className="font-semibold text-blue-300">Velocidad de escape:</p>
              <p className="text-sm">Tan rápido que la gravedad no puede retenerla. La bala escapa al espacio.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrbitalSimulator;