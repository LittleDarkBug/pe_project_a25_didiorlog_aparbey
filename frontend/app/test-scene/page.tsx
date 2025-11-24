'use client';

import SceneComponent from '@/app/components/3DandXRComponents/Scene/SceneComponent';
import { Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export default function TestScenePage() {
  const onSceneReady = (scene: Scene) => {
    // Configuration de la caméra ArcRotate (supporte zoom et rotation)
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2, // Angle horizontal (alpha)
      Math.PI / 3,  // Angle vertical (beta)
      15,           // Rayon/distance
      Vector3.Zero(), // Cible
      scene
    );
    
    // Activer les contrôles
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      camera.attachControl(canvas, false);
      
      // Empêcher le zoom de la page
      canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      
      // Limites de zoom
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 30;
      
      // Sensibilité
      camera.wheelPrecision = 50;
      camera.angularSensibilityX = 2000;
      camera.angularSensibilityY = 2000;
    }

    // Lumière principale
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Sol
    const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    const groundMaterial = new StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
    ground.material = groundMaterial;

    // Cube central
    const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position.y = 1;
    const boxMaterial = new StandardMaterial('boxMat', scene);
    boxMaterial.diffuseColor = new Color3(0.2, 0.6, 1.0);
    box.material = boxMaterial;

    // Sphère
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 1.5 }, scene);
    sphere.position = new Vector3(3, 1, 0);
    const sphereMaterial = new StandardMaterial('sphereMat', scene);
    sphereMaterial.diffuseColor = new Color3(1.0, 0.3, 0.3);
    sphere.material = sphereMaterial;

    // Cylindre
    const cylinder = MeshBuilder.CreateCylinder('cylinder', { height: 2, diameter: 1 }, scene);
    cylinder.position = new Vector3(-3, 1, 0);
    const cylinderMaterial = new StandardMaterial('cylinderMat', scene);
    cylinderMaterial.diffuseColor = new Color3(0.3, 1.0, 0.3);
    cylinder.material = cylinderMaterial;

    // Torus
    const torus = MeshBuilder.CreateTorus('torus', { diameter: 2, thickness: 0.5 }, scene);
    torus.position = new Vector3(0, 2, 3);
    const torusMaterial = new StandardMaterial('torusMat', scene);
    torusMaterial.diffuseColor = new Color3(1.0, 0.8, 0.2);
    torus.material = torusMaterial;
  };

  const onRender = (scene: Scene) => {
    // Animation des objets
    const box = scene.getMeshByName('box');
    if (box) {
      box.rotation.y += 0.01;
      box.rotation.x += 0.005;
    }

    const sphere = scene.getMeshByName('sphere');
    if (sphere) {
      sphere.position.y = 1 + Math.sin(Date.now() * 0.001) * 0.5;
    }

    const cylinder = scene.getMeshByName('cylinder');
    if (cylinder) {
      cylinder.rotation.y += 0.02;
    }

    const torus = scene.getMeshByName('torus');
    if (torus) {
      torus.rotation.x += 0.01;
      torus.rotation.z += 0.01;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <header className="bg-zinc-900 p-4 text-white">
        <h1 className="text-2xl font-bold">Test Scene Babylon.js</h1>
        <p className="text-sm text-zinc-400">
          Souris : Clic gauche + glisser pour pivoter, molette pour zoomer | Touchpad : Glisser avec 1 doigt pour pivoter, pincer pour zoomer
        </p>
      </header>
      
      <div className="flex-1">
        <SceneComponent 
          antialias
          adaptToDeviceRatio
          onSceneReady={onSceneReady} 
          onRender={onRender}
        />
      </div>

      <footer className="bg-zinc-900 p-3 text-center text-xs text-zinc-500">
        <p>Page de test - Babylon.js {'\u00B7'} Next.js</p>
      </footer>
    </div>
  );
}
