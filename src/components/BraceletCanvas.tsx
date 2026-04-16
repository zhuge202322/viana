// @ts-nocheck
"use client";

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Line, OrbitControls, Environment, ContactShadows, SpotLight } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';

const corsProxy = "https://images.weserv.nl/?url=";

// 单个图片组件：混合渲染模式
// 引入 react-spring/three 以实现丝滑的动画过渡
const BeadPlane = ({ bead, position, rotation, dialRotation, isDragged, currentDragPos, onPointerDown, onPointerMove, onPointerUp }) => {
  const filename = bead.image ? bead.image.split('/').pop() : '';
  // 修正一些 URL 参数导致的错误
  const cleanFilename = filename.split('?')[0];
  const textureUrl = cleanFilename ? `/images/beads/${cleanFilename}` : '/images/beads/default.png';
  
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      setTexture(tex);
    }, undefined, (err) => {
      console.warn("Failed to load texture:", textureUrl, err);
      // Fallback
    });
  }, [textureUrl]);
  
  // 核心判断
  const isRoundBead = bead.parentCategoryName === 'Beads' || bead.categoryName?.includes('Bead');
  const isPendant = bead.parentCategoryName === 'Pendants' || bead.categoryName?.includes('Pendant');

  // 如果是吊坠，强制将物理尺寸和显示尺寸固定为 10mm (1cm)
  // 这样所有的吊坠在 3D 画布上都会显示一样大，且占据固定的线圈空间
  const sizeMm = isPendant ? 10 : parseFloat(bead.size || 10);
  const displaySizeMm = sizeMm;
  const r = (displaySizeMm * 0.1) / 2;

  const groupRef = useRef();

  // 物理动画状态
  // 如果当前正在被拖拽，它的位置直接跟随鼠标(currentDragPos)
  // 如果没有被拖拽，它的位置平滑过渡到目标位置(position)
  const { springPos, springScale } = useSpring({
    springPos: isDragged && currentDragPos ? currentDragPos : position,
    springScale: isDragged ? 1.2 : 1,
    config: { mass: 1, tension: 300, friction: 25 } // 丝滑的物理弹簧配置
  });

  // 针对异形配件的“轴对齐广告牌”逻辑
  useFrame(({ camera }) => {
    if (!groupRef.current || isRoundBead) return;
    
    // 注意：获取当前在世界坐标系下的真实位置
    const worldPos = new THREE.Vector3();
    groupRef.current.parent.getWorldPosition(worldPos);
    
    const dx = camera.position.x - worldPos.x;
    const dy = camera.position.y - worldPos.y;
    const dz = camera.position.z - worldPos.z;
    
    // 加上表盘整体旋转的角度
    const rotZ = rotation[2] + (isPendant ? Math.PI : 0) + dialRotation;
    const localY = -dx * Math.sin(rotZ) + dy * Math.cos(rotZ);
    const localZ = dz;
    
    groupRef.current.rotation.x = Math.atan2(-localY, localZ);
  });

  const renderOrder = isDragged ? 999 : 0;

  return (
    <a.group 
      position={springPos} 
      rotation={isRoundBead ? [0, 0, 0] : [0, 0, rotation[2] + (isPendant ? Math.PI : 0)]} 
      scale={springScale.to(s => [s, s, s])}
    >
      <group ref={groupRef}>
        {isRoundBead ? (
          <mesh 
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            renderOrder={renderOrder}
          >
            <sphereGeometry args={[r, 32, 32]} />
            {texture && (
              <meshMatcapMaterial 
                matcap={texture} 
                color="#ffffff" 
                depthTest={!isDragged}
              />
            )}
          </mesh>
        ) : (
          <mesh 
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            renderOrder={renderOrder}
            // 配饰 (Accessories) 放在中心 [0, 0, 0.06]
            // 吊坠 (Pendants) 需要往下偏移，使其顶部的挂环穿过手绳，大约偏移 -r*0.9
            position={isPendant ? [0, -r * 0.9, 0.06] : [0, 0, 0.06]}
          >
            <planeGeometry args={[r * 2.2, r * 2.2]} />
            {texture && (
              <meshStandardMaterial 
                map={texture} 
                transparent={true} 
                alphaTest={0.05}
                side={THREE.DoubleSide} 
                depthWrite={!isDragged}
                roughness={0.4}
                metalness={0.1}
                emissive={new THREE.Color(0xffffff)}
                emissiveMap={texture}
                emissiveIntensity={0.2}
              />
            )}
          </mesh>
        )}
      </group>
    </a.group>
  );
};

// 辅助组件：用于接收外部指令重置摄像机位置
const ResetCamera = ({ trigger, controlsRef, setDialRotation }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (trigger > 0) {
      // 修改相机距离，拉近到 z=8，避免手串超出截图区域
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);
      // 修改视野角度
      camera.fov = 45;
      camera.updateProjectionMatrix();
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      if (setDialRotation) {
        setDialRotation(0);
      }
    }
  }, [trigger, camera, controlsRef, setDialRotation]);
  return null;
};

// 辅助组件：如果含有配饰，强制拉回正脸视角
const CameraLocker = ({ hasAccessories, controlsRef }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (hasAccessories) {
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [hasAccessories, camera, controlsRef]);
  return null;
};

// 辅助组件：八卦图背景（仅在 2D 转盘模式下显示，且在旋转时变亮）
const BaguaImage = ({ radius, isDragging }) => {
  const [texture, setTexture] = useState(null);
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/bagua.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      setTexture(tex);
    }, undefined, (err) => console.warn('Bagua texture missing', err));
  }, []);

  const { opacity } = useSpring({
    to: async (next) => {
      if (isDragging) {
        // 当开始拖拽时，实现多阶段渐变亮起
        await next({ opacity: 0.4, config: { duration: 150 } });
        await next({ opacity: 0.7, config: { duration: 150 } });
        await next({ opacity: 1.0, config: { duration: 200 } });
      } else {
        // 松开时，平滑变回全透明
        await next({ opacity: 0, config: { tension: 120, friction: 25 } });
      }
    },
    from: { opacity: 0 }
  });

  if (!texture) return null;

  return (
    <a.mesh position={[0, 0, -0.2]} renderOrder={-1}>
      <planeGeometry args={[radius * 1.6, radius * 1.6]} />
      <a.meshBasicMaterial 
        map={texture} 
        transparent={true} 
        opacity={opacity} 
        depthWrite={false} 
      />
    </a.mesh>
  );
};

// 辅助组件：真实质感的 3D 手绳
const RealisticString = ({ curvePoints, color }) => {
  const curve = useMemo(() => {
    if (curvePoints.length === 0) return null;
    return new THREE.CatmullRomCurve3(curvePoints, true);
  }, [curvePoints]);

  if (!curve) return null;

  return (
    <mesh position={[0, 0, 0]}>
      {/* tubularSegments: 128 (平滑的圆环), radius: 0.028 (比之前细30%, 适配1mm配饰), radialSegments: 16 */}
      <tubeGeometry args={[curve, 128, 0.028, 16, true]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.7} // 绳子通常比较粗糙
        metalness={0.1} // 轻微反光
      />
    </mesh>
  );
};

export default function BraceletCanvas({ beads, onRemoveBead, onReorderBeads, resetCamTrigger, stringColor = "#333333" }) {
  const [localBeads, setLocalBeads] = useState(beads);
  const draggedIndexRef = useRef(null);
  const [draggedIndexState, setDraggedIndexState] = useState(null);
  const [currentDragPos, setCurrentDragPos] = useState(null); // 记录鼠标拖拽的实时 3D 坐标
  const dragStartPos = useRef({ x: 0, y: 0 });
  const controlsRef = useRef();

  const hasAccessories = useMemo(() => {
    return localBeads.some(b => {
      const isRound = b.parentCategoryName === 'Beads' || b.categoryName?.includes('Bead');
      return !isRound;
    });
  }, [localBeads]);

  const [dialRotation, setDialRotation] = useState(0);
  const [isDraggingDial, setIsDraggingDial] = useState(false);
  const isDialDragging = useRef(false);
  const lastDialAngle = useRef(0);

  const getLocalPoint = (point) => {
    const x = point.x * Math.cos(-dialRotation) - point.y * Math.sin(-dialRotation);
    const y = point.x * Math.sin(-dialRotation) + point.y * Math.cos(-dialRotation);
    return { x, y };
  };

  const handleBgPointerDown = (e) => {
    if (!hasAccessories) return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    isDialDragging.current = true;
    setIsDraggingDial(true);
    lastDialAngle.current = Math.atan2(e.point.y, e.point.x);
  };

  const handleBgPointerMove = (e) => {
    if (!isDialDragging.current || !hasAccessories) return;
    e.stopPropagation();
    const currentAngle = Math.atan2(e.point.y, e.point.x);
    let delta = currentAngle - lastDialAngle.current;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    setDialRotation(prev => prev + delta);
    lastDialAngle.current = currentAngle;
  };

  const handleBgPointerUp = (e) => {
    if (!hasAccessories) return;
    e.stopPropagation();
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
    isDialDragging.current = false;
    setIsDraggingDial(false);
  };

  // 当外部的珠子列表变化时（比如添加了新珠子、删除了珠子），同步更新本地状态
  useEffect(() => {
    setLocalBeads(beads);
  }, [beads]);

  // --- 核心算法：解决珠子排列缝隙与重叠的问题 ---
  const ringData = useMemo(() => {
    if (!localBeads || localBeads.length === 0) return { positions: [], rotations: [], curvePoints: [], centerAngles: [] };

    const scale = 0.1; // 将 mm 转换为 3D 世界的单位
    const radii = localBeads.map(b => (parseFloat(b.size || 10) * scale) / 2);
    
    let R = 2.54; 
    let totalAngle = 0;
    const angles = [];
    
    for (let i = 0; i < radii.length; i++) {
      const r1 = radii[i];
      const r2 = radii[(i + 1) % radii.length];
      const chordLength = r1 + r2;
      let val = chordLength / (2 * R);
      if (val > 1) val = 1;
      const angle = 2 * Math.asin(val);
      angles.push(angle);
      totalAngle += angle;
    }

    if (totalAngle > Math.PI * 2) {
      let iter = 0;
      while (totalAngle > Math.PI * 2 && iter < 100) {
        R += 0.1;
        totalAngle = 0;
        for (let i = 0; i < radii.length; i++) {
          const r1 = radii[i];
          const r2 = radii[(i + 1) % radii.length];
          const chordLength = r1 + r2;
          let val = chordLength / (2 * R);
          if (val > 1) val = 1;
          totalAngle += 2 * Math.asin(val);
        }
        iter++;
      }
      
      angles.length = 0;
      for (let i = 0; i < radii.length; i++) {
        const r1 = radii[i];
        const r2 = radii[(i + 1) % radii.length];
        const chordLength = r1 + r2;
        let val = chordLength / (2 * R);
        if (val > 1) val = 1;
        angles.push(2 * Math.asin(val));
      }
    }

    const positions = [];
    const rotations = [];
    const centerAngles = []; // 记录每个珠子所在的角度，用于拖拽吸附
    let currentAngle = Math.PI; 
    
    for (let i = 0; i < localBeads.length; i++) {
      const posX = Math.cos(currentAngle) * R;
      const posY = Math.sin(currentAngle) * R;
      
      positions.push([posX, posY, 0]); 
      rotations.push([0, 0, currentAngle - Math.PI / 2]); 
      centerAngles.push(currentAngle);
      
      currentAngle -= angles[i];
    }

    const curvePoints = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      curvePoints.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
    }

    return { positions, rotations, curvePoints, centerAngles, radius: R };
  }, [localBeads]);

  const handlePointerDown = (e, idx) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    
    draggedIndexRef.current = idx;
    setDraggedIndexState(idx); // 触发重新渲染以显示拖拽样式
    
    // 记录初始鼠标位置，用于判断是点击还是拖拽
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // 初始化拖拽坐标为珠子当前位置
    setCurrentDragPos(ringData.positions[idx]);
    
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  const handlePointerMove = (e) => {
    const currentDragIndex = draggedIndexRef.current;
    if (currentDragIndex === null) return;
    
    e.stopPropagation();
    
    // 将鼠标的屏幕坐标 (NDC) 反投影到 Z=0 的 3D 平面上，获得真实的 3D 世界坐标
    const vec = new THREE.Vector3(e.pointer.x, e.pointer.y, 0.5);
    vec.unproject(e.camera);
    const dir = vec.sub(e.camera.position).normalize();
    const distance = -e.camera.position.z / dir.z;
    const pos = e.camera.position.clone().add(dir.multiplyScalar(distance));
    
    // 转换为表盘本地坐标系
    const localPoint = getLocalPoint(pos);
    setCurrentDragPos([localPoint.x, localPoint.y, 0]);
    
    // 计算鼠标当前在手串圆盘上的角度
    const mouseAngle = Math.atan2(localPoint.y, localPoint.x);
    
    // 找到距离鼠标角度最近的那个珠子位置
    let closestIdx = currentDragIndex;
    let minDiff = Infinity;
    
    ringData.centerAngles.forEach((ang, i) => {
      let diff = Math.abs(mouseAngle - ang);
      // 处理跨越 2PI (360度) 边界的情况
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    // 如果鼠标移动到了另一个珠子的领地，触发位置互换
    if (closestIdx !== currentDragIndex) {
      setLocalBeads(prev => {
        const next = [...prev];
        const [moved] = next.splice(currentDragIndex, 1);
        next.splice(closestIdx, 0, moved);
        return next;
      });
      // 同步更新索引，因为珠子在数组里的位置已经变了
      draggedIndexRef.current = closestIdx;
      setDraggedIndexState(closestIdx);
    }
  };

  const handlePointerUp = (e, idx) => {
    const currentDragIndex = draggedIndexRef.current;
    if (currentDragIndex === null) return;
    
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    
    // 计算鼠标从按下到松开的移动距离
    const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
    
    if (dist < 5) {
      // 距离很小，说明是“点击”事件，执行删除
      onRemoveBead(idx);
    } else {
      // 距离较大，说明是“拖拽”事件结束，通知父组件保存最新的排序
      if (onReorderBeads) {
        onReorderBeads(localBeads);
      }
    }
    
    // 恢复状态
    draggedIndexRef.current = null;
    setDraggedIndexState(null);
    setCurrentDragPos(null);
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  return (
    <Canvas 
      camera={{ position: [0, 0, 10], fov: 45 }}
      gl={{ preserveDrawingBuffer: true }} // 允许通过 toDataURL 提取图片
    >
      <ResetCamera trigger={resetCamTrigger} controlsRef={controlsRef} setDialRotation={setDialRotation} />
      <CameraLocker hasAccessories={hasAccessories} controlsRef={controlsRef} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={!hasAccessories}
        // 默认的 OrbitControls 不允许 Roll (Z轴/顺时针逆时针) 旋转
        // 如果没有配饰，用户可以自由翻转；如果有配饰，则锁定摄像机，通过下方的平面进行 2D 转盘旋转
      />
      
      {/* 珠宝展示灯光系统：使用无方向性的全局光照和柔和的面光，避免旋转时的死角阴影 */}
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight position={[0, 0, 10]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[0, 0, -10]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[10, 0, 0]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[-10, 0, 0]} intensity={0.5} color="#ffffff" />
      
      {/* 移除了 Spotlight 和 ContactShadows，避免在 360 度旋转和缩放时产生探照灯穿帮和不合理的地面投影 */}

      {/* 隐藏的背景板：用于在锁定 3D 旋转时，捕获鼠标拖拽来实现 2D 转盘旋转 */}
      {hasAccessories && (
        <mesh 
          position={[0, 0, -5]} 
          onPointerDown={handleBgPointerDown}
          onPointerMove={handleBgPointerMove}
          onPointerUp={handleBgPointerUp}
          onPointerCancel={handleBgPointerUp}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <group rotation={[0, 0, dialRotation]}>
        {hasAccessories && (
          <BaguaImage radius={ringData.radius || 2.54} isDragging={isDraggingDial} />
        )}
        
        {ringData.curvePoints.length > 0 && (
          <RealisticString 
            curvePoints={ringData.curvePoints} 
            color={stringColor} 
          />
        )}

        {localBeads.map((bead, idx) => (
          <React.Suspense fallback={null} key={bead.uniqueId}>
            <BeadPlane 
              bead={bead} 
              position={ringData.positions[idx]} 
              rotation={ringData.rotations[idx]}
              dialRotation={dialRotation}
              isDragged={draggedIndexState === idx}
              onPointerDown={(e) => handlePointerDown(e, idx)}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(e, idx)}
            />
          </React.Suspense>
        ))}
      </group>
    </Canvas>
  );
}
