import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Panel } from './Layout';
import { theme } from '../styles/theme';

// --- Fractal Structure Component ---
const FractalTree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Recursively generate branches
  const branches = useMemo(() => {
    const data: { start: THREE.Vector3, end: THREE.Vector3, thickness: number }[] = [];
    
    const generate = (start: THREE.Vector3, dir: THREE.Vector3, length: number, thickness: number, depth: number) => {
      if (depth === 0) return;

      const end = new THREE.Vector3().copy(start).add(dir.clone().multiplyScalar(length));
      data.push({ start, end, thickness });

      // Create 2-3 sub-branches
      const numBranches = 2;
      for (let i = 0; i < numBranches; i++) {
        const angleX = (Math.random() - 0.5) * 1.5;
        const angleZ = (Math.random() - 0.5) * 1.5;
        const newDir = dir.clone().applyEuler(new THREE.Euler(angleX, 0, angleZ)).normalize();
        generate(end, newDir, length * 0.7, thickness * 0.7, depth - 1);
      }
    };

    generate(new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 1, 0), 2.5, 0.4, 5);
    return data;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      // Pulse effect for Pseudocapacitance
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {branches.map((b, i) => (
        <mesh key={i} position={b.start.clone().add(b.end).multiplyScalar(0.5)} 
              quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.end.clone().sub(b.start).normalize())}>
          <cylinderGeometry args={[b.thickness * 0.7, b.thickness, b.start.distanceTo(b.end), 8]} />
          <meshStandardMaterial 
            color="#444" 
            emissive={theme.colors.secondary} 
            emissiveIntensity={0.5} 
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
      <Html position={[0, 2, 0]}>
        <div style={{ color: theme.colors.primary, background: 'rgba(0,0,0,0.8)', padding: '4px', borderRadius: '4px', fontSize: '10px', pointerEvents: 'none' }}>
          碳金属骨架
        </div>
      </Html>
    </group>
  );
};

// --- Ion Particles Component ---
const Ions = () => {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02),
      target: new THREE.Vector3(0, 0, 0) // Attract to center
    }));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      // Move towards center (Double Layer Effect Simulation)
      const dir = new THREE.Vector3().subVectors(particle.target, particle.position).normalize().multiplyScalar(0.05);
      
      // Add some noise/Brownian motion
      particle.velocity.add(dir).add(new THREE.Vector3((Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01));
      
      // Clamp velocity
      particle.velocity.clampLength(0, 0.1);
      particle.position.add(particle.velocity);

      // Reset if too close or too far
      if (particle.position.length() < 0.5) {
         particle.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
         particle.velocity.set(0,0,0);
      }

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(0.1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={theme.colors.success} transparent opacity={0.6} />
    </instancedMesh>
  );
};

// --- Main Visualization Component ---
const PrincipleVis: React.FC = () => {
  const [showIons, setShowIons] = useState(true);

  return (
    <Panel style={{ height: '100%', padding: '0' }} title="">
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <h3 style={{ color: theme.colors.text.accent, textTransform: 'uppercase', marginBottom: '5px' }}>储能原理可视化</h3>
        <p style={{ color: theme.colors.text.secondary, fontSize: '0.8rem' }}>
          RCCM 三维导电网状结构 / 双电层效应演示
        </p>
      </div>
      
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowIons(!showIons)}
            style={{ 
              background: showIons ? theme.colors.primary : 'transparent', 
              color: showIons ? '#000' : theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {showIons ? '隐藏离子迁移' : '显示离子迁移'}
          </button>
      </div>

      <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
        <color attach="background" args={['#050510']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, -5]} intensity={0.5} color={theme.colors.primary} />
        
        <FractalTree position={[0, -1, 0]} />
        {showIons && <Ions />}
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls autoRotate autoRotateSpeed={0.5} minDistance={3} maxDistance={20} />
        <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, -3, 0]} />
      </Canvas>
    </Panel>
  );
};

export default PrincipleVis;
