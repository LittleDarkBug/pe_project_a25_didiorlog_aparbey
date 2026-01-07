'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3399ff" />
    </mesh>
  );
}

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 1 + Math.sin(clock.elapsedTime) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 1, 0]}>
      <sphereGeometry args={[0.75, 32, 32]} />
      <meshStandardMaterial color="#ff5555" />
    </mesh>
  );
}

function AnimatedCylinder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[-3, 1, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
      <meshStandardMaterial color="#55ff55" />
    </mesh>
  );
}

function AnimatedTorus() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.z += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 2, 3]}>
      <torusGeometry args={[1, 0.25, 16, 100]} />
      <meshStandardMaterial color="#ffcc33" />
    </mesh>
  );
}

export default function TestScenePage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="bg-zinc-900 p-4 text-white">
        <h1 className="text-2xl font-bold">Test Scene React Three Fiber</h1>
        <p className="text-sm text-zinc-400">
          Souris : Clic gauche + glisser pour pivoter, molette pour zoomer | Touchpad : Glisser avec 1 doigt pour pivoter, pincer pour zoomer
        </p>
      </header>

      <div className="flex-1">
        <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Controls */}
          <OrbitControls
            minDistance={5}
            maxDistance={30}
            enablePan={true}
          />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
          <Grid infiniteGrid fadeDistance={50} />

          {/* Animated Objects */}
          <AnimatedBox />
          <AnimatedSphere />
          <AnimatedCylinder />
          <AnimatedTorus />

          {/* Background */}
          <color attach="background" args={['#111111']} />
        </Canvas>
      </div>

      <footer className="bg-zinc-900 p-3 text-center text-xs text-zinc-500">
        <p>Page de test - React Three Fiber · Next.js</p>
      </footer>
    </div>
  );
}
