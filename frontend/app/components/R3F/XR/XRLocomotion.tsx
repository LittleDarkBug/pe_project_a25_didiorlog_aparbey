'use client';

import { useXRInputSourceState, useXR } from '@react-three/xr';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useXROriginRef } from './XRCanvas';

interface XRLocomotionProps {
    speed?: number;
    rotationSpeed?: number;
    /** Enable vertical movement (fly up/down with controller triggers) */
    enableVertical?: boolean;
}

/**
 * XR Locomotion component for free-flight navigation.
 * Uses XROriginContext to get direct ref to the origin group.
 * 
 * Controls:
 * - Left Controller Thumbstick: Move forward/backward/strafe
 * - Right Controller Thumbstick: Snap rotation (horizontal)
 * - Left Trigger: Fly up
 * - Left Grip: Fly down
 */
export default function XRLocomotion({
    speed = 0.08,
    rotationSpeed = 0.04,
    enableVertical = true
}: XRLocomotionProps) {
    // Get XR state for session check
    const xr = useXR();

    // Get origin ref from context (direct ref to Three.js group)
    const originRef = useXROriginRef();

    // Get controller states
    const leftState = useXRInputSourceState('controller', 'left');
    const rightState = useXRInputSourceState('controller', 'right');

    // Refs for snap turn debounce
    const lastSnapTime = useRef(0);
    const tempVector = useRef(new THREE.Vector3());

    useFrame(({ camera }) => {
        // Only process in XR mode with active session
        if (!xr.session) return;

        // Get origin from context ref
        const origin = originRef?.current;
        if (!origin) {
            // Fallback: try useXR().origin if context not available
            const xrOrigin = xr.origin as THREE.Group | null;
            if (!xrOrigin) return;
            processMovement(xrOrigin, camera);
            return;
        }

        processMovement(origin, camera);
    });

    function processMovement(origin: THREE.Group, camera: THREE.Camera) {
        const now = performance.now();

        // --- MOVEMENT (Left Controller Thumbstick) ---
        if (leftState?.gamepad) {
            // Cast to any to access raw WebXR Gamepad API properties
            const gamepad = leftState.gamepad as any;
            const axes = gamepad.axes as number[] | undefined;

            // Read thumbstick axes - try both mappings
            let xAxis = 0;
            let yAxis = 0;

            if (axes && axes.length >= 4) {
                // Standard XR mapping: axes 2,3 are thumbstick
                xAxis = axes[2] ?? 0;
                yAxis = axes[3] ?? 0;
            } else if (axes && axes.length >= 2) {
                // Fallback for some controllers
                xAxis = axes[0] ?? 0;
                yAxis = axes[1] ?? 0;
            }

            // Apply deadzone
            const deadzone = 0.12;
            if (Math.abs(xAxis) < deadzone) xAxis = 0;
            if (Math.abs(yAxis) < deadzone) yAxis = 0;

            if (xAxis !== 0 || yAxis !== 0) {
                // Get forward direction from camera (world space)
                camera.getWorldDirection(tempVector.current);

                // For horizontal movement, zero out Y
                tempVector.current.y = 0;
                tempVector.current.normalize();

                const forward = tempVector.current.clone();

                // Right direction (cross product with world up)
                const right = new THREE.Vector3();
                right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

                // Calculate movement: -yAxis = forward (push up = move forward)
                const movement = new THREE.Vector3();
                movement.addScaledVector(forward, -yAxis * speed);
                movement.addScaledVector(right, -xAxis * speed);

                // Apply movement to origin position
                origin.position.add(movement);
            }

            // Vertical movement via triggers/grip
            if (enableVertical && gamepad.buttons) {
                const buttons = gamepad.buttons as Array<{ pressed?: boolean; value?: number }>;
                const trigger = buttons[0];
                const grip = buttons[1];

                // Trigger = fly up, Grip = fly down
                if (trigger?.pressed || (trigger?.value && trigger.value > 0.1)) {
                    origin.position.y += (trigger.value ?? 0.5) * speed * 0.7;
                }
                if (grip?.pressed || (grip?.value && grip.value > 0.1)) {
                    origin.position.y -= (grip.value ?? 0.5) * speed * 0.7;
                }
            }
        }

        // --- ROTATION (Right Controller Thumbstick - Snap Turn) ---
        if (rightState?.gamepad) {
            const gamepad = rightState.gamepad as any;
            const axes = gamepad.axes as number[] | undefined;

            let xAxis = 0;
            if (axes && axes.length >= 4) {
                xAxis = axes[2] ?? 0;
            } else if (axes && axes.length >= 2) {
                xAxis = axes[0] ?? 0;
            }

            // Snap turn with debounce
            const snapThreshold = 0.65;
            const snapCooldown = 280; // ms

            if (Math.abs(xAxis) > snapThreshold && (now - lastSnapTime.current) > snapCooldown) {
                // Snap turn: ±30 degrees
                const snapAngle = xAxis > 0 ? -Math.PI / 6 : Math.PI / 6;

                // Rotate around camera position (user's head)
                const cameraWorldPos = new THREE.Vector3();
                camera.getWorldPosition(cameraWorldPos);

                // Translate, rotate, translate back
                origin.position.sub(cameraWorldPos);
                origin.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), snapAngle);
                origin.position.add(cameraWorldPos);
                origin.rotation.y += snapAngle;

                lastSnapTime.current = now;
            }

            // Smooth rotation (for smaller stick deflections)
            const smoothThreshold = 0.25;
            if (Math.abs(xAxis) > smoothThreshold && Math.abs(xAxis) <= snapThreshold) {
                origin.rotation.y -= xAxis * rotationSpeed;
            }
        }
    }

    return null;
}
