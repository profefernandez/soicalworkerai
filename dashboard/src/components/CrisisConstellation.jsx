import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useMemo } from 'react';
import SessionNode from './SessionNode';

function Scene({ sessions, onSelectSession }) {
  const positions = useMemo(() => {
    return sessions.map((_, i) => {
      const angle = i * 0.8;
      const radius = 1.5 + i * 0.4;
      return [
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2,
        Math.sin(angle) * radius,
      ];
    });
  }, [sessions.length]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#E8913A" />
      <pointLight position={[-5, -3, 5]} intensity={0.3} color="#C4785C" />

      <Stars radius={50} depth={50} count={1000} factor={2} saturation={0} fade speed={0.3} />

      {sessions.map((session, i) => (
        <SessionNode
          key={session.id}
          position={positions[i] || [0, 0, 0]}
          session={session}
          isCrisis={!!session.crisis_active}
          onClick={onSelectSession}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.8} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

export default function CrisisConstellation({ sessions, onSelectSession }) {
  return (
    <div className="w-full h-full bg-ember-base rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1A1614' }}
      >
        <Scene sessions={sessions} onSelectSession={onSelectSession} />
      </Canvas>
    </div>
  );
}
