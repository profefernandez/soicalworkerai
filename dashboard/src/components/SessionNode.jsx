import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';

export default function SessionNode({ position, session, onClick, isCrisis }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const baseColor = isCrisis ? '#D94F4F' : '#7BA68C';
  const emissiveIntensity = isCrisis ? 1.5 : 0.3;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.15;

    if (isCrisis) {
      const pulse = Math.sin(t * 2) * 0.5 + 0.5;
      meshRef.current.scale.setScalar(1 + pulse * 0.15);
      meshRef.current.material.emissiveIntensity = emissiveIntensity + pulse * 0.8;
    }

    if (hovered && !isCrisis) {
      meshRef.current.scale.lerp({ x: 1.3, y: 1.3, z: 1.3 }, 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(session);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Billboard position={[0, 0.55, 0]}>
        <Text fontSize={0.12} color="#F0EBE3" anchorX="center" anchorY="middle">
          {session.id?.substring(0, 8)}
        </Text>
      </Billboard>

      {isCrisis && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.5, 32]} />
          <meshBasicMaterial color="#D94F4F" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
