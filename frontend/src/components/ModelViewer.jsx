import React, { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
  Html
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { AxesHelper } from "three";

function STLModel({ url }) {
  const geometry = useLoader(STLLoader, url);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#60a5fa"
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

export default function ModelViewer({ modelUrl, showAxes }) {
  return (
    <div className="w-full h-full min-h-[400px] bg-[#0b1120] rounded-xl overflow-hidden">
      <Canvas camera={{ position: [150, 150, 150], fov: 45 }}>
        <Suspense fallback={<Html center>Loading 3D model...</Html>}>
          <Stage environment="city" intensity={0.6}>
            <STLModel url={modelUrl} />
          </Stage>
        </Suspense>

        {showAxes && <primitive object={new AxesHelper(80)} />}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}