/* eslint-disable no-restricted-syntax */
// ---- code for drawing with three.js ----
import * as THREE from 'three';
import { SceneBoxMessage } from '../WebSocket/ViserMessages';

export function drawSceneBox(sceneBox: SceneBoxMessage): THREE.Object3D {
  const box = sceneBox;

  const w = 1.0;
  const aaa = new THREE.Vector3(w, w, w);
  const aab = new THREE.Vector3(w, w, -w);
  const aba = new THREE.Vector3(w, -w, w);
  const baa = new THREE.Vector3(-w, w, w);
  const abb = new THREE.Vector3(w, -w, -w);
  const bba = new THREE.Vector3(-w, -w, w);
  const bab = new THREE.Vector3(-w, w, -w);
  const bbb = new THREE.Vector3(-w, -w, -w);
  let points = [aaa, aab, aaa, aba, aab, abb, aba, abb];
  points = points.concat([baa, bab, baa, bba, bab, bbb, bba, bbb]);
  points = points.concat([aaa, baa, aab, bab, aba, bba, abb, bbb]);

  const maxPoint = new THREE.Vector3(...box.max);
  const minPoint = new THREE.Vector3(...box.min);

  const lengths = maxPoint.clone();
  lengths.sub(minPoint);

  const scalar = lengths.clone();
  scalar.divide(new THREE.Vector3(2.0, 2.0, 2.0));

  const offset = minPoint.clone();
  offset.add(scalar);
  for (let i = 0; i < points.length; i += 1) {
    points[i] = points[i].clone();
    points[i].multiply(scalar).add(offset);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });
  const lines = new THREE.LineSegments(geometry, material);
  return lines;
}

export function getCameraWireframe(
  scale = 0.3,
  focalLength = 4,
  w = 1.5,
  h = 2,
) {
  // Returns a wireframe of a 3D line-plot of a camera symbol.
  // A wireframe is a frustum.
  // https://github.com/hangg7/mvs_visual/blob/275d382a824733a3187a8e3147be184dd6f14795/mvs_visual.py#L54.
  // scale: scale of rendering
  // focalLength: this is the focal length
  // w: width
  // h: height
  const f = focalLength;

  const ul = new THREE.Vector3(-w, h, -f);
  const ur = new THREE.Vector3(w, h, -f);
  const ll = new THREE.Vector3(-w, -h, -f);
  const lr = new THREE.Vector3(w, -h, -f);
  const C = new THREE.Vector3(0, 0, 0);
  const points = [
    C,
    ul,
    C,
    ur,
    C,
    ll,
    C,
    lr,
    C,
    ul,
    ur,
    ul,
    lr,
    ur,
    lr,
    ll,
    ll,
    ul,
  ];

  const scalar = new THREE.Vector3(scale, scale, scale);
  for (let i = 0; i < points.length; i += 1) {
    points[i].multiply(scalar);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });
  const lines = new THREE.LineSegments(geometry, material);
  return lines;
}

export function drawCameraImagePlane(width, height, imageString, name) {
  // imageString is the texture as a base64 string
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
  });
  const texture = new THREE.TextureLoader().load(imageString);
  material.map = texture;
  const plane = new THREE.Mesh(geometry, material);
  plane.name = name;
  return plane;
}

function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

export function drawCamera(camera, name): THREE.Object3D {
  const group = new THREE.Group();

  console.assert(
    camera.type === 'PinholeCamera',
    'The camera should be a PinholeCamera',
  );

  const height = 0.05;
  const displayedFocalLength = height;
  const width = (height * camera.cx) / camera.cy;
  const cameraWireframeObject = getCameraWireframe(
    1.0,
    displayedFocalLength,
    width,
    height,
  );
  cameraWireframeObject.translateZ(displayedFocalLength); // move the wireframe frustum back
  group.add(cameraWireframeObject);
  const cameraImagePlaneObject = drawCameraImagePlane(
    width * 2,
    height * 2,
    camera.image,
    name,
  );
  group.add(cameraImagePlaneObject);

  // make homogeneous coordinates and then
  // transpose and flatten the matrix into an array
  let c2w = JSON.parse(JSON.stringify(camera.camera_to_world));
  c2w.push([0, 0, 0, 1]);
  c2w = transpose(c2w).flat();

  const mat = new THREE.Matrix4();
  mat.fromArray(c2w);
  mat.decompose(group.position, group.quaternion, group.scale);

  return group;
}

export function drawCameras(cameras): Record<number, THREE.Object3D> {
  const cameraObjects = {};
  for (const [key, camera] of Object.entries(cameras)) {
    cameraObjects[key] = drawCamera(camera);
  }
  return cameraObjects;
}

export function drawLayout(category: String, init_opacity: Number,
                                             init_theta?: Number,
                                             init_size?: THREE.Vector3,
                                             init_pos?: THREE.Vector3): THREE.Object3D {
  const categorySettings = {
    unlabeled: { size: new THREE.Vector3(0.1, 1, 0.6), color: 0x9ffd32 },
    wall: { size: new THREE.Vector3(0.1, 1, 0.6), color: 0xaec7e8 },
    floor: { size: new THREE.Vector3(1, 1, 0.1), color: 0x98df8a },
    cabinet: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x1ff77b4 },
    bed: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xffbb78 },
    chair: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xbcbd22 },
    sofa: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x8c564b },
    table: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xff9896 },
    door: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xfd62728 },
    window: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xc5b0d5 },
    bookshelf: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x9467bd },
    picture: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xc49c94 },
    counter: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x17becf },
    blinds: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xb24c4c },
    desk: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xf7b6d2 },
    shelves: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x42bc66 },
    curtain: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xdbdb8d },
    dresser: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x8c39c5 },
    pillow: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xcab934 },
    mirror: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x33b0cb },
    floormat: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xc83683 },
    clothes: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x5cc13d },
    ceiling: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x4e47b7 },
    books: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xac7252 },
    refrigerator: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xff7f0e },
    television: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x5ba38a },
    paper: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x99629c },
    towel: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x8c9965 },
    showercurtain: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x9edae5 },
    box: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x647d9a },
    whiteboard: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xb27f87 },
    person: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x78b980 },
    nightstand: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x926fc2 },
    toilet: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x2ca02c },
    sink: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x708090 },
    lamp: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x60cfd1 },
    bathtub: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xe377c2 },
    bag: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0xd55cb0 },
    otherstructure: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x5e6ad3 },
    otherfurniture: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x5254a3 },
    otherprop: { size: new THREE.Vector3(0.2, 0.3, 0.5), color: 0x645590 },
    garbagebin: { size: new THREE.Vector3(0.1, 1, 0.6), color: 0x9ffd32 },
  };

  const {size: defaultSize, color} = categorySettings[category];
  const size = init_size ?? defaultSize;
  const position = init_pos ?? new THREE.Vector3(0, 0, size.z / 2 - 1);
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: init_opacity });
  const layoutObject = new THREE.Mesh(geometry, material);

  const edges = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ color, transparent: false });
  const edgeMesh = new THREE.LineSegments(edges, edgesMaterial);

  layoutObject.add(edgeMesh);

  // add `size` attribute in order to change them
  layoutObject.originalSize = size.clone();
  layoutObject.size = size;
  layoutObject.opacity = 0.6;
  layoutObject.position.set(position.x, position.y, position.z);
  layoutObject.rotation.set(0, 0, Math.PI / 180 * (init_theta + 90));

  return layoutObject;
}
