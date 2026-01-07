'use client';

import { useXRInputSourceState } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface XRLocomotionProps {
    speed?: number;
    rotationSpeed?: number;
}

/**
 * XR Locomotion component for free-flight navigation.
 * Uses standard WebXR Gamepad API.
 * Left Controller: Move (Axes 2, 3)
 * Right Controller: Rotate (Axes 2, 3)
 */
export default function XRLocomotion({
    speed = 0.1, // Increased default speed
    rotationSpeed = 0.02
}: XRLocomotionProps) {
    // Get controller states
    const leftState = useXRInputSourceState('controller', 'left');
    const rightState = useXRInputSourceState('controller', 'right');

    useFrame(({ camera }) => {
        // --- MOVEMENT (Left Controller) ---
        if (leftState && leftState.gamepad) {
            const gamepad = leftState.gamepad as any;

            // Standard XR mapping: Axes 2 (X) and 3 (Y) are usually the thumbstick
            // Fallback to 0 and 1 if 2/3 are empty (some emulators)
            const axes = gamepad.axes;
            const xAxis = axes && axes.length > 2 ? axes[2] : (axes ? axes[0] : 0);
            const yAxis = axes && axes.length > 3 ? axes[3] : (axes ? axes[1] : 0);

            if (xAxis !== undefined && yAxis !== undefined) {
                // Deadzone
                if (Math.abs(xAxis) > 0.1 || Math.abs(yAxis) > 0.1) {

                    // Get forward direction relative to user view
                    const forward = new THREE.Vector3();
                    camera.getWorldDirection(forward);
                    forward.y = 0; // Constrain to horizontal plane (walking/flying level)
                    forward.normalize();

                    // Get right direction
                    const right = new THREE.Vector3();
                    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

                    // Calculate movement vector
                    const moveVector = new THREE.Vector3();

                    // -yAxis is Forward (pushing stick up gives negative value usually)
                    moveVector.addScaledVector(forward, -yAxis * speed);
                    moveVector.addScaledVector(right, xAxis * speed);

                    // IMPORTANT: Move the RIG (camera parent), not the camera itself.
                    // In WebXR, camera position is overwritten by headset pose relative to rig.
                    if (camera.parent) {
                        camera.parent.position.add(moveVector);
                    } else {
                        // Fallback if no parent (unlikely in XR)
                        camera.position.add(moveVector);
                    }
                }
            }
        }

        // --- ROTATION (Right Controller) ---
        if (rightState && rightState.gamepad) {
            const gamepad = rightState.gamepad as any;
            const axes = gamepad.axes;
            const xAxis = axes && axes.length > 2 ? axes[2] : (axes ? axes[0] : 0);

            if (xAxis !== undefined && Math.abs(xAxis) > 0.2) {
                // Rotate camera rig around Y axis
                if (camera.parent) {
                    camera.parent.rotation.y -= xAxis * rotationSpeed;
                } else {
                    camera.rotation.y -= xAxis * rotationSpeed;
                }
            }
        }
    });

    return null;
}
