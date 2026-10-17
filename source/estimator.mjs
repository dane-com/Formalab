export const densities={PLA:1.24,PETG:1.27,TPU:1.21,'PLA FLEXI':1.24,ABS:1.04,ASA:1.07};
export function estimatePrint({volume,area,scale=1,infill=15,support=0,material='PLA'}){
 if(![volume,area,scale,infill,support].every(Number.isFinite)||volume<=0||area<=0||scale<=0||scale>1000000||infill<0||infill>100||support<0||support>50||!densities[material])throw Error('Enter valid model settings.');
 const v=volume*scale**3,a=area*scale**2;
 // A surface-shell approximation, not toolpath generation. 1.2 mm shell allowance.
 const shell=Math.min(v,a*1.2),plastic=shell+(v-shell)*(infill/100);
 const grams=plastic/1000*densities[material]*(1+support/100);
 return {weight:Math.max(.01,Math.round(grams*100)/100),volume:v,area:a,density:densities[material]};
}
export function inspectGeometry(root,THREE){
 root.updateMatrixWorld(true);let volume=0,area=0,triangles=0,meshes=0,closed=true;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3(),cross=new THREE.Vector3();
 root.traverse(mesh=>{if(!mesh.isMesh)return;meshes++;const g=mesh.geometry,p=g.attributes.position,index=g.index;if(!p)throw Error('This file has no model vertices.');const n=index?index.count:p.count;triangles+=n/3;if(triangles>300000)throw Error('Model is too detailed. Export a mesh with fewer than 300,000 triangles.');
 const edges=new Map(),key=t=>`${Math.round(t.x*1e5)},${Math.round(t.y*1e5)},${Math.round(t.z*1e5)}`;let signed=0;const origin=new THREE.Vector3().fromBufferAttribute(p,0).applyMatrix4(mesh.matrixWorld);
 for(let i=0;i<n;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);if(![a,b,c].every(t=>[t.x,t.y,t.z].every(Number.isFinite)))throw Error('Model contains invalid coordinates.');u.subVectors(b,a);v.subVectors(c,a);const triArea=cross.crossVectors(u,v).length()/2;area+=triArea;u.subVectors(b,origin);v.subVectors(c,origin);cross.crossVectors(u,v);signed+=new THREE.Vector3().subVectors(a,origin).dot(cross)/6;
 // Collinear facets still carry shared boundary edges; omit only collapsed vertices.
 const ks=[key(a),key(b),key(c)];if(new Set(ks).size<3)continue;for(let j=0;j<3;j++){const x=ks[j],y=ks[(j+1)%3],k=x<y?x+'|'+y:y+'|'+x,edge=edges.get(k)||[0,0];edge[0]++;edge[1]+=x<y?1:-1;edges.set(k,edge);}}
 if([...edges.values()].some(e=>e[0]!==2||e[1]!==0))closed=false;volume+=Math.abs(signed);
 });if(!meshes||!triangles)throw Error('No printable mesh found. Upload a model-containing STL or 3MF.');return {volume,area,triangles,meshes,closed};
}
