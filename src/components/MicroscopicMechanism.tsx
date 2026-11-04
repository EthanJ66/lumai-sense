import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Panel } from './Layout';
import { theme } from '../styles/theme';

// --- Constants ---
const COLOR_GOLD = '#FFD700';
const COLOR_BRANCH = '#8B6914'; // 金棕色骨架
const COLOR_ION = theme.colors.primary; // Cyan
const COLOR_REDOX = theme.colors.danger; // Red
const COLOR_CONCRETE = '#333';
const COLOR_ELECTRON = '#00ff88'; // Green for electron transfer
const COLOR_DOUBLE_LAYER = '#4fc3f7'; // Light blue for double layer

// 1. Fractal Skeleton (Recursive)
const Branch: React.FC<{ start: THREE.Vector3; end: THREE.Vector3; thickness: number; depth: number }> = ({ start, end, thickness, depth }) => {
  if (depth === 0) return null;

  const length = start.distanceTo(end);
  const position = start.clone().lerp(end, 0.5);
  const direction = end.clone().sub(start).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  const subBranches = [];
  if (depth > 1) {
    const subLength = length * 0.7;
    const subThickness = thickness * 0.7;
    const count = 2; 
    for (let i = 0; i < count; i++) {
        const angleY = (i === 0 ? 0.8 : -0.8) + Math.sin(depth * 132.1) * 0.2;
        const angleZ = (i === 0 ? 0.5 : -0.5) + Math.cos(depth * 41.2) * 0.2;
        const subDir = direction.clone().applyEuler(new THREE.Euler(angleZ, angleY, 0)).normalize();
        const subEnd = end.clone().add(subDir.multiplyScalar(subLength));
        subBranches.push(<Branch key={`${depth}-${i}`} start={end} end={subEnd} thickness={subThickness} depth={depth - 1} />);
    }
  }

  const hasRedox = depth < 4 && Math.random() > 0.3; 

  return (
    <group>
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[thickness, thickness, length, 12]} />
        <meshStandardMaterial
            color={COLOR_BRANCH}
            emissive={COLOR_GOLD}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.8}
        />
        {/* Wireframe overlay for tech look */}
        {depth < 3 && (
            <meshBasicMaterial color={COLOR_GOLD} wireframe transparent opacity={0.1} />
        )}
      </mesh>
      {hasRedox && <RedoxParticle position={end} />}
      {subBranches}
    </group>
  );
};

// 2. Redox Particle (High Emission)
const RedoxParticle: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  const ref = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    if (ref.current) {
        const time = state.clock.elapsedTime;
        const scale = 1 + Math.sin(time * 8 + position.x) * 0.3;
        ref.current.scale.setScalar(scale);
        if (Math.random() < 0.02) setActive(true);
        if (active && Math.random() < 0.1) setActive(false);
        const mat = ref.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = active ? 4 : 0.5; 
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color={COLOR_REDOX} emissive={COLOR_REDOX} emissiveIntensity={0.5} toneMapped={false} />
    </mesh>
  );
};

// 3. Ions (Glowing Spheres)
const Ions: React.FC = () => {
    const count = 150;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10),
            velocity: new THREE.Vector3(0,0,0),
            target: new THREE.Vector3(0,0,0) 
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        particles.forEach((p, i) => {
            const dir = p.target.clone().sub(p.position).normalize().multiplyScalar(0.03);
            p.position.add(dir);
            p.position.add(new THREE.Vector3(Math.sin(time*2+i)*0.01, Math.cos(time*3+i)*0.01, Math.sin(time+i)*0.01));
            if (p.position.distanceTo(p.target) < 0.5) {
                p.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10).multiplyScalar(1.5);
            }
            dummy.position.copy(p.position);
            dummy.scale.setScalar(0.08);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={COLOR_ION} transparent opacity={0.6} />
        </instancedMesh>
    );
};

// 4. Double Layer Effect - Ion accumulation at electrode surface
const DoubleLayerEffect: React.FC = () => {
    const ringRef = useRef<THREE.Mesh>(null);
    const innerRingRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (ringRef.current) {
            ringRef.current.rotation.z = time * 0.5;
            const mat = ringRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.3 + Math.sin(time * 2) * 0.1;
        }
        if (innerRingRef.current) {
            innerRingRef.current.rotation.z = -time * 0.8;
        }
    });

    return (
        <group position={[0, -1, 0]}>
            {/* Outer double layer ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.5, 0.08, 8, 64]} />
                <meshBasicMaterial color={COLOR_DOUBLE_LAYER} transparent opacity={0.4} />
            </mesh>
            {/* Inner Helmholtz layer */}
            <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.0, 0.05, 8, 64]} />
                <meshBasicMaterial color={COLOR_ION} transparent opacity={0.6} />
            </mesh>
            {/* Diffuse layer particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <DiffuseIon key={i} index={i} />
            ))}
        </group>
    );
};

// Diffuse layer ion
const DiffuseIon: React.FC<{ index: number }> = ({ index }) => {
    const ref = useRef<THREE.Mesh>(null);
    const angle = (index / 20) * Math.PI * 2;
    const baseRadius = 2.2 + Math.random() * 0.5;

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.elapsedTime;
            const r = baseRadius + Math.sin(time * 2 + index) * 0.3;
            ref.current.position.x = Math.cos(angle + time * 0.3) * r;
            ref.current.position.z = Math.sin(angle + time * 0.3) * r;
            ref.current.position.y = Math.sin(time * 3 + index * 0.5) * 0.2;
        }
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={COLOR_DOUBLE_LAYER} transparent opacity={0.8} />
        </mesh>
    );
};

// 5. Electron Transfer Effect - Pseudocapacitor visualization
const ElectronTransfer: React.FC = () => {
    const count = 30;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const electrons = useMemo(() => {
        return Array.from({ length: count }).map(() => ({
            startPos: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2 - 1,
                (Math.random() - 0.5) * 3
            ),
            progress: Math.random(),
            speed: 0.3 + Math.random() * 0.4
        }));
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;

        electrons.forEach((e, i) => {
            e.progress += e.speed * 0.02;
            if (e.progress > 1) {
                e.progress = 0;
                e.startPos.set(
                    (Math.random() - 0.5) * 3,
                    Math.random() * 2 - 1,
                    (Math.random() - 0.5) * 3
                );
            }

            // Move toward center (electrode surface)
            const targetPos = e.startPos.clone().multiplyScalar(1 - e.progress * 0.8);
            dummy.position.copy(targetPos);
            dummy.scale.setScalar(0.04 * (1 - e.progress * 0.5));
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={COLOR_ELECTRON} transparent opacity={0.9} />
        </instancedMesh>
    );
};

const Scene = () => {
    return (
        <group rotation={[0, Math.PI / 4, 0]}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color={COLOR_GOLD} />
            <pointLight position={[-10, 5, -5]} intensity={2} color={COLOR_ION} />

            <mesh position={[0, -4, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={COLOR_CONCRETE} transparent opacity={0.2} roughness={1} />
                <gridHelper args={[20, 10, '#444', '#222']} rotation={[-Math.PI/2,0,0]} />
            </mesh>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <Branch start={new THREE.Vector3(0, -2, 0)} end={new THREE.Vector3(0, 0.5, 0)} thickness={0.4} depth={5} />
            </Float>
            <Ions />
            <DoubleLayerEffect />
            <ElectronTransfer />
        </group>
    );
};

const MicroscopicMechanism: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <Panel title="微观储能机理" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, ...style }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 2, 7], fov: 40 }} gl={{ antialias: true }}>
            <color attach="background" args={['#050B14']} />
            
            <Suspense fallback={null}>
                <Scene />
            </Suspense>

            <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} enablePan={false} />
        </Canvas>
        
        {/* HTML Overlays */}
        <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
            <div style={{ fontSize: '11px', color: theme.colors.primary, fontWeight: 'bold', marginBottom: 8 }}>
              双电层/赝电容协同效应
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, background: COLOR_DOUBLE_LAYER, borderRadius: '50%', boxShadow: `0 0 8px ${COLOR_DOUBLE_LAYER}`, marginRight: 6 }}></span>
                <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>双电层 (物理吸附)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, background: COLOR_ELECTRON, borderRadius: '50%', boxShadow: `0 0 8px ${COLOR_ELECTRON}`, marginRight: 6 }}></span>
                <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>电子转移 (赝电容)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, background: COLOR_REDOX, borderRadius: '50%', boxShadow: `0 0 8px ${COLOR_REDOX}`, marginRight: 6 }}></span>
                <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>氧化还原反应</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, background: COLOR_ION, borderRadius: '50%', boxShadow: `0 0 8px ${COLOR_ION}`, marginRight: 6 }}></span>
                <span style={{ fontSize: '10px', color: theme.colors.text.secondary }}>离子迁移</span>
            </div>
        </div>
      </div>
      <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 240, 255, 0.05)',
          borderTop: `1px solid ${theme.colors.panel.border}`,
          fontSize: '0.75rem',
          color: theme.colors.text.secondary,
          textAlign: 'justify',
          fontFamily: theme.fonts.mono
      }}>
        [协同机理] 双电层效应通过物理吸附实现快速充放电，赝电容效应通过法拉第氧化还原反应提供高能量密度，两者协同实现RCCM基质的高效储能。
      </div>
    </Panel>
  );
};

export default MicroscopicMechanism;
