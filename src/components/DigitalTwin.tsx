import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Panel } from './Layout';
import { MONITOR_PROJECTS, REGIONS } from '../data/projects';

// --- Constants ---
const ROAD_WIDTH = 18; // 单方向道路宽度（3车道）
const LANE_WIDTH = 3;
const INTERSECTION_SIZE = ROAD_WIDTH * 2; // 十字路口中心区域
const ROAD_LENGTH = 60; // 道路延伸长度

// --- Glow Material Helper ---
const GlowMaterial: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 2 }) => (
  <meshStandardMaterial
    color={color}
    emissive={color}
    emissiveIntensity={intensity}
    toneMapped={false}
  />
);

// --- 信号波纹效果 (WiFi样式) ---
const SignalRings: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ringsRef.current) {
      const t = state.clock.elapsedTime;
      ringsRef.current.children.forEach((ring, i) => {
        const scale = 1 + ((t * 0.5 + i * 0.3) % 1) * 2;
        ring.scale.setScalar(scale);
        (ring as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 2 * (1 - ((t * 0.5 + i * 0.3) % 1)),
          transparent: true,
          opacity: 0.8 * (1 - ((t * 0.5 + i * 0.3) % 1)),
          side: THREE.DoubleSide,
        });
      });
    }
  });

  return (
    <group position={position} ref={ringsRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// --- 空中节点数据 ---
const AIR_NODES = [
  [0, 15, 0],
  [-25, 12, -25],
  [25, 12, -25],
  [-25, 12, 25],
  [25, 12, 25],
  [0, 10, -40],
  [0, 10, 40],
  [-40, 10, 0],
  [40, 10, 0],
] as [number, number, number][];

// --- 数据连接线网络 (仅显示空中节点) ---
const DataNetwork: React.FC = () => {
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (linesRef.current) {
      const t = state.clock.elapsedTime;
      linesRef.current.children.forEach((child, i) => {
        if ((child as THREE.Line).material) {
          const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
          mat.opacity = 0.3 + Math.sin(t * 2 + i * 0.5) * 0.2;
        }
      });
    }
  });

  // 节点之间的连接
  const connections = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];
    AIR_NODES.forEach((node, i) => {
      if (i < AIR_NODES.length - 1) {
        lines.push({ start: node, end: AIR_NODES[(i + 1) % AIR_NODES.length], color: '#00ffff' });
      }
      // 中心节点连接所有
      if (i > 0) {
        lines.push({ start: AIR_NODES[0], end: node, color: '#0088ff' });
      }
    });
    return lines;
  }, []);

  return (
    <group ref={linesRef}>
      {/* 空中连接线 */}
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={[conn.start, conn.end]}
          color={conn.color}
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
          dashSize={0.5}
          dashScale={2}
        />
      ))}
      
      {/* 空中节点 */}
      {AIR_NODES.map((pos, i) => (
        <group key={`node-${i}`} position={pos}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <GlowMaterial color={i === 0 ? '#00ffff' : '#0088ff'} intensity={3} />
          </mesh>
          <SignalRings position={[0, 0, 0]} color={i === 0 ? '#00ffff' : '#0066ff'} />
        </group>
      ))}
    </group>
  );
};

// --- 十字路口道路 ---
const CrossroadRoad: React.FC = () => {
  return (
    <group>
      {/* 地面基础 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#1a3a1a" roughness={0.9} />
      </mesh>

      {/* 南北方向道路 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH * 2 + INTERSECTION_SIZE]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>

      {/* 东西方向道路 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[ROAD_LENGTH * 2 + INTERSECTION_SIZE, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>

      {/* 中心线 - 南北 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2]}>
        <planeGeometry args={[0.15, ROAD_LENGTH - 10]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2]}>
        <planeGeometry args={[0.15, ROAD_LENGTH - 10]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>

      {/* 中心线 - 东西 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2, 0.02, 0]}>
        <planeGeometry args={[ROAD_LENGTH - 10, 0.15]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2, 0.02, 0]}>
        <planeGeometry args={[ROAD_LENGTH - 10, 0.15]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>

      {/* 车道分隔线 - 南北方向 */}
      {[-2, -1, 1, 2].map((lane) => (
        <group key={`ns-lane-${lane}`}>
          {/* 北段 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={`n-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[lane * LANE_WIDTH, 0.02, -INTERSECTION_SIZE / 2 - 5 - i * 6]}
            >
              <planeGeometry args={[0.1, 3]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* 南段 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={`s-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[lane * LANE_WIDTH, 0.02, INTERSECTION_SIZE / 2 + 5 + i * 6]}
            >
              <planeGeometry args={[0.1, 3]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 车道分隔线 - 东西方向 */}
      {[-2, -1, 1, 2].map((lane) => (
        <group key={`ew-lane-${lane}`}>
          {/* 西段 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={`w-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[-INTERSECTION_SIZE / 2 - 5 - i * 6, 0.02, lane * LANE_WIDTH]}
            >
              <planeGeometry args={[3, 0.1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* 东段 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={`e-${i}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[INTERSECTION_SIZE / 2 + 5 + i * 6, 0.02, lane * LANE_WIDTH]}
            >
              <planeGeometry args={[3, 0.1]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 人行横道 - 四个方向 */}
      {[
        { pos: [0, 0.02, -INTERSECTION_SIZE / 2 - 2] as [number, number, number], rot: 0 },
        { pos: [0, 0.02, INTERSECTION_SIZE / 2 + 2] as [number, number, number], rot: 0 },
        { pos: [-INTERSECTION_SIZE / 2 - 2, 0.02, 0] as [number, number, number], rot: Math.PI / 2 },
        { pos: [INTERSECTION_SIZE / 2 + 2, 0.02, 0] as [number, number, number], rot: Math.PI / 2 },
      ].map((crosswalk, idx) => (
        <group key={`crosswalk-${idx}`} position={crosswalk.pos} rotation={[0, crosswalk.rot, 0]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 3.5) * 2, 0, 0]}>
              <planeGeometry args={[1.2, 4]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 道路边缘发光线 */}
      {[
        [-ROAD_WIDTH / 2, 0],
        [ROAD_WIDTH / 2, 0],
      ].map((pos, i) => (
        <group key={`edge-ns-${i}`}>
          <mesh position={[pos[0], 0.03, -ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, ROAD_LENGTH]} />
            <GlowMaterial color="#00ffff" intensity={2} />
          </mesh>
          <mesh position={[pos[0], 0.03, ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, ROAD_LENGTH]} />
            <GlowMaterial color="#00ffff" intensity={2} />
          </mesh>
        </group>
      ))}

      {[
        [0, -ROAD_WIDTH / 2],
        [0, ROAD_WIDTH / 2],
      ].map((pos, i) => (
        <group key={`edge-ew-${i}`}>
          <mesh position={[-ROAD_LENGTH / 2 - INTERSECTION_SIZE / 2, 0.03, pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LENGTH, 0.1]} />
            <GlowMaterial color="#00ffff" intensity={2} />
          </mesh>
          <mesh position={[ROAD_LENGTH / 2 + INTERSECTION_SIZE / 2, 0.03, pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_LENGTH, 0.1]} />
            <GlowMaterial color="#00ffff" intensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// --- 车辆模型 ---
const Car: React.FC<{ color: string; glowColor: string }> = ({ color, glowColor }) => (
  <group>
    <mesh position={[0, 0.25, 0]} castShadow>
      <boxGeometry args={[1.8, 0.4, 4]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.55, -0.3]} castShadow>
      <boxGeometry args={[1.6, 0.35, 2]} />
      <meshStandardMaterial color="#1a1a2a" metalness={0.5} roughness={0.1} />
    </mesh>
    {/* 车灯 */}
    <mesh position={[0, 0.3, 2.01]}>
      <boxGeometry args={[1.4, 0.15, 0.02]} />
      <GlowMaterial color="#ffffff" intensity={4} />
    </mesh>
    <mesh position={[0, 0.3, -2.01]}>
      <boxGeometry args={[1.4, 0.1, 0.02]} />
      <GlowMaterial color="#ff3333" intensity={3} />
    </mesh>
    {/* 底部发光 */}
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[1.6, 0.02, 3.8]} />
      <GlowMaterial color={glowColor} intensity={3} />
    </mesh>
  </group>
);

const SUV: React.FC<{ color: string; glowColor: string }> = ({ color, glowColor }) => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow>
      <boxGeometry args={[2, 0.5, 4.5]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.75, -0.2]} castShadow>
      <boxGeometry args={[1.8, 0.45, 2.5]} />
      <meshStandardMaterial color="#1a1a2a" metalness={0.5} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0.4, 2.26]}>
      <boxGeometry args={[1.6, 0.15, 0.02]} />
      <GlowMaterial color="#ffffff" intensity={4} />
    </mesh>
    <mesh position={[0, 0.4, -2.26]}>
      <boxGeometry args={[1.6, 0.1, 0.02]} />
      <GlowMaterial color="#ff3333" intensity={3} />
    </mesh>
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[1.8, 0.02, 4.3]} />
      <GlowMaterial color={glowColor} intensity={3} />
    </mesh>
  </group>
);

const Truck: React.FC<{ color: string; glowColor: string }> = ({ color, glowColor }) => (
  <group>
    {/* 货箱 */}
    <mesh position={[0, 1.2, 1]} castShadow>
      <boxGeometry args={[2.2, 1.8, 5]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
    {/* 驾驶室 */}
    <mesh position={[0, 0.8, -2.8]} castShadow>
      <boxGeometry args={[2.2, 1.4, 2]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.5, -3.81]}>
      <boxGeometry args={[1.8, 0.2, 0.02]} />
      <GlowMaterial color="#ffffff" intensity={4} />
    </mesh>
    <mesh position={[0, 0.8, 3.51]}>
      <boxGeometry args={[2, 0.15, 0.02]} />
      <GlowMaterial color="#ff3333" intensity={3} />
    </mesh>
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[2, 0.02, 7]} />
      <GlowMaterial color={glowColor} intensity={2.5} />
    </mesh>
  </group>
);

const Bus: React.FC<{ color: string; glowColor: string }> = ({ color, glowColor }) => (
  <group>
    <mesh position={[0, 1, 0]} castShadow>
      <boxGeometry args={[2.5, 1.8, 8]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
    {/* 窗户 */}
    {[-1.26, 1.26].map((x, i) => (
      <mesh key={i} position={[x, 1.2, 0]}>
        <boxGeometry args={[0.02, 0.8, 7]} />
        <GlowMaterial color="#66aaff" intensity={1.5} />
      </mesh>
    ))}
    <mesh position={[0, 0.6, 4.01]}>
      <boxGeometry args={[2, 0.2, 0.02]} />
      <GlowMaterial color="#ffffff" intensity={4} />
    </mesh>
    <mesh position={[0, 0.6, -4.01]}>
      <boxGeometry args={[2, 0.15, 0.02]} />
      <GlowMaterial color="#ff3333" intensity={3} />
    </mesh>
    <mesh position={[0, 0.05, 0]}>
      <boxGeometry args={[2.3, 0.02, 7.8]} />
      <GlowMaterial color={glowColor} intensity={3} />
    </mesh>
  </group>
);

// --- 车辆数据类型 ---
interface VehicleData {
  id: number;
  type: 'car' | 'suv' | 'truck' | 'bus';
  x: number;
  z: number;
  rotation: number;
  color: string;
  glowColor: string;
  speed: number;
  direction: 'n' | 's' | 'e' | 'w';
  lane: number;
}

// --- 动态连接线 (跟随车辆) ---
const VehicleLink: React.FC<{ startPos: THREE.Vector3; color: string }> = ({ startPos, color }) => {
  const lineRef = useRef<any>(null);
  
  useFrame(() => {
    if (lineRef.current) {
      // 计算最近的空中节点（世界坐标）
      let nearestDist = Infinity;
      let nearestNode = AIR_NODES[0];
      
      const worldPos = startPos.clone(); // 车辆当前位置（世界）
      
      AIR_NODES.forEach(node => {
        const nodeVec = new THREE.Vector3(...node);
        const dist = worldPos.distanceTo(nodeVec);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestNode = node;
        }
      });
      
      // 更新线段端点 (相对于车辆的局部坐标)
      // 车辆中心是 (0,0,0)，车顶大约是 (0, 2, 0)
      // 目标点需要转换为局部坐标： targetLocal = vehicle.worldToLocal(targetWorld)
      // 但这里我们简单点，直接画线，因为 Line 组件是在车辆 Group 里的
      // 终点坐标 = (node.x - car.x, node.y - car.y, node.z - car.z) 这种相对偏移还需考虑旋转
      // 最稳妥是用 worldToLocal
      
      const parent = lineRef.current.parent;
      if (parent) {
        const targetWorld = new THREE.Vector3(...nearestNode);
        const targetLocal = parent.worldToLocal(targetWorld.clone());
        
        // 更新几何体顶点
        const points = [
          new THREE.Vector3(0, 2, 0), // 车顶
          targetLocal
        ];
        lineRef.current.geometry.setFromPoints(points);
      }
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color={color} transparent opacity={0.4} />
    </line>
  );
};

// --- 车辆底部雷达扫描圈 ---
const RadarRing: React.FC<{ color: string }> = ({ color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      // 周期性缩放和透明度变化
      const scale = 1 + (t % 1.5) * 2;
      const opacity = 1 - (t % 1.5) / 1.5;
      
      meshRef.current.scale.setScalar(scale);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = opacity * 0.6;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[1.5, 1.8, 32]} />
      <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

// --- 单个车辆组件 ---
const VehicleInstance: React.FC<{ data: VehicleData }> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      let newX = data.x;
      let newZ = data.z;
      
      // 根据方向移动
      const movement = t * data.speed;
      switch (data.direction) {
        case 'n':
          newZ = data.z - (movement % 120) + 60;
          if (newZ < -60) newZ += 120;
          break;
        case 's':
          newZ = data.z + (movement % 120) - 60;
          if (newZ > 60) newZ -= 120;
          break;
        case 'e':
          newX = data.x + (movement % 120) - 60;
          if (newX > 60) newX -= 120;
          break;
        case 'w':
          newX = data.x - (movement % 120) + 60;
          if (newX < -60) newX += 120;
          break;
      }
      
      groupRef.current.position.x = newX;
      groupRef.current.position.z = newZ;
    }
  });

  const VehicleComponent = {
    car: Car,
    suv: SUV,
    truck: Truck,
    bus: Bus,
  }[data.type];

  // 为每辆车创建一个跟随的连接线组件
  // 注意：我们在 VehicleInstance 内部无法轻易获取其实时世界坐标传给子组件
  // 但我们可以在子组件内部通过 ref 获取父级位置
  
  return (
    <group ref={groupRef} position={[data.x, 0, data.z]} rotation={[0, data.rotation, 0]}>
      <VehicleComponent color={data.color} glowColor={data.glowColor} />
      {/* 底部雷达圈 */}
      <RadarRing color={data.glowColor} />
      
      {/* 车顶信号 */}
      <SignalRings position={[0, data.type === 'bus' ? 2.5 : data.type === 'truck' ? 2.5 : 1.2, 0]} color={data.glowColor} />
      
      {/* 动态连接线 */}
      <VehicleLink startPos={new THREE.Vector3(data.x, 0, data.z)} color={data.glowColor} />
    </group>
  );
};

// --- 交通系统 ---
const TrafficSystem: React.FC<{ onVehiclesUpdate: (vehicles: VehicleData[]) => void }> = ({ onVehiclesUpdate }) => {
  const vehicles = useMemo(() => {
    const result: VehicleData[] = [];
    let id = 0;

    const colors = [
      { color: '#2a4a6a', glowColor: '#00ffff' },
      { color: '#4a2a4a', glowColor: '#ff00ff' },
      { color: '#3a5a3a', glowColor: '#00ff88' },
      { color: '#5a4a2a', glowColor: '#ffaa00' },
      { color: '#2a3a5a', glowColor: '#0088ff' },
    ];

    // 南北方向车辆（向北）
    for (let i = 0; i < 4; i++) {
      const lane = [-7.5, -4.5, -1.5][i % 3];
      result.push({
        id: id++,
        type: ['car', 'suv', 'car', 'bus'][i] as VehicleData['type'],
        x: lane,
        z: 20 + i * 15,
        rotation: 0,
        ...colors[i % colors.length],
        speed: 2 + Math.random(),
        direction: 'n',
        lane: i % 3,
      });
    }

    // 南北方向车辆（向南）
    for (let i = 0; i < 4; i++) {
      const lane = [1.5, 4.5, 7.5][i % 3];
      result.push({
        id: id++,
        type: ['suv', 'car', 'truck', 'car'][i] as VehicleData['type'],
        x: lane,
        z: -20 - i * 15,
        rotation: Math.PI,
        ...colors[(i + 2) % colors.length],
        speed: 2 + Math.random(),
        direction: 's',
        lane: i % 3,
      });
    }

    // 东西方向车辆（向东）
    for (let i = 0; i < 3; i++) {
      const lane = [-7.5, -4.5, -1.5][i % 3];
      result.push({
        id: id++,
        type: ['car', 'truck', 'suv'][i] as VehicleData['type'],
        x: -25 - i * 15,
        z: lane,
        rotation: Math.PI / 2,
        ...colors[(i + 1) % colors.length],
        speed: 2.5 + Math.random(),
        direction: 'e',
        lane: i % 3,
      });
    }

    // 东西方向车辆（向西）
    for (let i = 0; i < 3; i++) {
      const lane = [1.5, 4.5, 7.5][i % 3];
      result.push({
        id: id++,
        type: ['suv', 'car', 'car'][i] as VehicleData['type'],
        x: 25 + i * 15,
        z: lane,
        rotation: -Math.PI / 2,
        ...colors[(i + 3) % colors.length],
        speed: 2.5 + Math.random(),
        direction: 'w',
        lane: i % 3,
      });
    }

    return result;
  }, []);

  // 通知父组件车辆数据
  React.useEffect(() => {
    onVehiclesUpdate(vehicles);
  }, [vehicles, onVehiclesUpdate]);

  return (
    <group>
      {vehicles.map((v) => (
        <VehicleInstance key={v.id} data={v} />
      ))}
    </group>
  );
};

// --- 建筑物 ---
const Buildings: React.FC = () => {
  const buildings = useMemo(() => [
    // 四个角落的建筑群
    { x: -45, z: -45, w: 20, h: 30, d: 20 },
    { x: -35, z: -60, w: 15, h: 25, d: 15 },
    { x: -60, z: -35, w: 15, h: 35, d: 15 },
    
    { x: 45, z: -45, w: 20, h: 28, d: 20 },
    { x: 35, z: -60, w: 15, h: 32, d: 15 },
    { x: 60, z: -35, w: 15, h: 24, d: 15 },
    
    { x: -45, z: 45, w: 20, h: 32, d: 20 },
    { x: -60, z: 35, w: 15, h: 26, d: 15 },
    { x: -35, z: 60, w: 15, h: 22, d: 15 },
    
    { x: 45, z: 45, w: 20, h: 36, d: 20 },
    { x: 60, z: 35, w: 15, h: 25, d: 15 },
    { x: 35, z: 60, w: 15, h: 28, d: 15 },
  ], []);

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          {/* 建筑主体 - 玻璃幕墙风格 */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshPhysicalMaterial 
              color="#eef5ff" 
              metalness={0.2} 
              roughness={0.1}
              transmission={0.6} // 玻璃感
              thickness={1.5}
              transparent
              opacity={0.9}
              clearcoat={1}
            />
          </mesh>
          
          {/* 内部楼板结构 (透过玻璃隐约可见) */}
          {Array.from({ length: Math.floor(b.h / 4) }).map((_, floor) => (
            <mesh key={`floor-${floor}`} position={[0, -b.h/2 + (floor + 1) * 4, 0]}>
              <boxGeometry args={[b.w - 0.5, 0.2, b.d - 0.5]} />
              <meshStandardMaterial color="#aaccff" />
            </mesh>
          ))}

          {/* 建筑边缘轮廓 */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(b.w, b.h, b.d)]} />
            <lineBasicMaterial color="#aaccff" transparent opacity={0.5} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
};

// --- 树木 ---
const Trees: React.FC = () => {
  const trees = useMemo(() => {
    const result: [number, number, number][] = [];
    // 道路两侧的行道树
    for (let i = -50; i <= 50; i += 10) {
      if (Math.abs(i) > 15) {
        result.push([-12, 0, i]);
        result.push([12, 0, i]);
        result.push([i, 0, -12]);
        result.push([i, 0, 12]);
      }
    }
    return result;
  }, []);

  return (
    <group>
      {trees.map((pos, i) => (
        <group key={i} position={pos}>
          {/* 树干 */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
            <meshStandardMaterial color="#4a3520" />
          </mesh>
          {/* 树冠 */}
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[2, 8, 8]} />
            <meshStandardMaterial color="#2a5a2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// --- Scene Component ---
const Scene: React.FC = () => {
  const [, setVehicles] = React.useState<VehicleData[]>([]);

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.4} color="#8899aa" />
      
      {/* 主方向光（模拟太阳） */}
      <directionalLight
        position={[30, 50, 30]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* 补光 */}
      <pointLight position={[0, 30, 0]} intensity={0.5} color="#aaccff" distance={100} />
      
      {/* 雾效 */}
      <fog attach="fog" args={['#b8c8d8', 60, 150]} />
      
      {/* 十字路口 */}
      <CrossroadRoad />
      
      {/* 交通系统 */}
      <TrafficSystem onVehiclesUpdate={setVehicles} />
      
      {/* 数据网络连接线 */}
      <DataNetwork />
      
      {/* 建筑物 */}
      <Buildings />
      
      {/* 树木 */}
      <Trees />
    </>
  );
};

// --- Main Component ---
const DigitalTwin: React.FC = () => {
  // 定位状态管理
  const [currentRegion, setCurrentRegion] = useState<'qingdao' | 'binzhou'>('qingdao');
  const [currentProject, setCurrentProject] = useState(MONITOR_PROJECTS[0]);

  // 模拟自动切换项目（仅同区域内）
  useEffect(() => {
    const interval = setInterval(() => {
      const regionProjects = MONITOR_PROJECTS.filter(p => 
        currentRegion === 'qingdao' ? p.location.includes('青岛') || p.location.includes('山东省') : p.location.includes('滨州')
      );
      if (regionProjects.length > 0) {
        const randomProject = regionProjects[Math.floor(Math.random() * regionProjects.length)];
        setCurrentProject(randomProject);
      }
    }, 8000); // 每8秒切换一次展示项目
    return () => clearInterval(interval);
  }, [currentRegion]);

  return (
    <Panel title="数字孪生 - 智慧交通监控" style={{ height: '100%', minHeight: '500px' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '450px' }}>
        <Canvas
          shadows
          camera={{ position: [50, 40, 50], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #E0F0FF 100%)' }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={20}
            maxDistance={120}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0, 0]}
          />
        </Canvas>
        
        {/* 定位切换 HUD */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 20, 40, 0.9)',
            border: '1px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            display: 'flex',
            gap: '12px',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setCurrentRegion('qingdao')}
            style={{
              background: currentRegion === 'qingdao' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              border: 'none',
              color: currentRegion === 'qingdao' ? '#00ffff' : '#88aacc',
              padding: '4px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
            }}
          >
            青岛黄岛区
          </button>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <button
            onClick={() => setCurrentRegion('binzhou')}
            style={{
              background: currentRegion === 'binzhou' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              border: 'none',
              color: currentRegion === 'binzhou' ? '#00ffff' : '#88aacc',
              padding: '4px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
            }}
          >
            山东滨州市
          </button>
        </div>

        {/* 当前监测点位信息 */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '14px', color: '#00ffff', marginBottom: '4px' }}>
            <span style={{ marginRight: '8px' }}>📍</span>
            {currentRegion === 'qingdao' ? REGIONS.qingdao.name : REGIONS.binzhou.name}
          </div>
          <div style={{ fontSize: '12px', color: '#aaccff', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '4px' }}>
            正在监测: {currentProject.name}
          </div>
        </div>

        {/* UI 覆盖层 - 实时监控 */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 30, 60, 0.85)',
            border: '1px solid rgba(0, 255, 255, 0.5)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#00ffff',
            fontSize: '12px',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>
            智慧交通监控
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div style={{ color: '#88aacc', fontSize: '10px' }}>在线车辆</div>
              <div style={{ fontSize: '20px', color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>14</div>
            </div>
            <div>
              <div style={{ color: '#88aacc', fontSize: '10px' }}>数据节点</div>
              <div style={{ fontSize: '20px', color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>9</div>
            </div>
          </div>
        </div>

        {/* 能量指标 */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 30, 60, 0.85)',
            border: '1px solid rgba(0, 200, 255, 0.5)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#00ccff',
            fontSize: '12px',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px' }}>
            道路储能状态
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <span style={{ color: '#88aacc' }}>储能功率</span>
              <span style={{ color: '#00ffff' }}>198 W/m·h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <span style={{ color: '#88aacc' }}>充电效率</span>
              <span style={{ color: '#00ff88' }}>92.5%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <span style={{ color: '#88aacc' }}>固碳量</span>
              <span style={{ color: '#88ff00' }}>45 kg/m³</span>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0, 30, 60, 0.85)',
            border: '1px solid rgba(0, 255, 255, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '11px',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>车辆类型</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#00ffff', borderRadius: '2px' }} />
              <span>轿车/SUV</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#ffaa00', borderRadius: '2px' }} />
              <span>卡车</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', background: '#0088ff', borderRadius: '2px' }} />
              <span>公交车</span>
            </div>
          </div>
        </div>

        {/* 底部状态栏 */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0, 30, 60, 0.85)',
            border: '1px solid rgba(0, 255, 136, 0.5)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#00ff88',
            fontSize: '11px',
            fontFamily: 'monospace',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ 
            width: '8px', 
            height: '8px', 
            background: '#00ff88', 
            borderRadius: '50%',
            boxShadow: '0 0 10px #00ff88',
            animation: 'pulse 2s infinite',
          }} />
          <span>物联网连接正常 | 数据传输中...</span>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </Panel>
  );
};

export default DigitalTwin;
