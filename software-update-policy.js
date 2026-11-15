/** Comparación pura de versiones publicadas de PlegadoX. */
export function validRelease(release){
 return !!(release&&typeof release==='object'&&
  typeof release.build==='string'&&/^PLEGADOX-[A-Z0-9-]{6,70}$/.test(release.build)&&
  typeof release.version==='string'&&/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/.test(release.version));
}
export function parseReleaseRevision(build){
 const m=/^PLEGADOX-(\d{8})-R(\d+)$/.exec(String(build||''));
 return m?{date:Number(m[1]),revision:Number(m[2])}:null;
}
const versionParts=value=>{
 const m=/^(\d+)\.(\d+)\.(\d+)/.exec(String(value||''));
 return m?[Number(m[1]),Number(m[2]),Number(m[3])]:null;
};
/** No sustituye una revisión nueva por una copia vieja de GitHub Pages. */
export function canInstallRelease(remote,installedBuild,installedVersion){
 if(!validRelease(remote))return false;
 if(remote.build===installedBuild)return false;
 const candidate=parseReleaseRevision(remote.build);
 const installed=parseReleaseRevision(installedBuild);
 if(candidate&&installed)
  return candidate.date>installed.date||
   candidate.date===installed.date&&candidate.revision>installed.revision;
 const newerVersion=versionParts(remote.version),oldVersion=versionParts(installedVersion);
 if(!newerVersion||!oldVersion)return false;
 for(let i=0;i<3;i++){
  if(newerVersion[i]>oldVersion[i])return true;
  if(newerVersion[i]<oldVersion[i])return false;
 }
 // Si el origen utiliza un identificador no comparable con fecha/R,
 // no actualizar silenciosamente dos builds de igual versión.
 return false;
}
