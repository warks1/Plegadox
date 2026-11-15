import test from 'node:test';
import assert from 'node:assert/strict';
import {validRelease,parseReleaseRevision,canInstallRelease} from '../software-update-policy.js';
const installedBuild='PLEGADOX-20261115-R49',installedVersion='0.9.25';
const release=(build,version)=>({build,version});
test('reconoce el identificador y versión de una publicación real',()=>{
 assert.equal(validRelease(release('PLEGADOX-20261115-R50','0.9.26')),true);
 assert.equal(validRelease(release('otra-app','0.9.26')),false);
 assert.equal(validRelease({build:'PLEGADOX-20261115-R50',version:'../../otro'}),false);
});
test('solo instala una revisión superior, no la misma ni anteriores',()=>{
 assert.equal(canInstallRelease(release('PLEGADOX-20261115-R50','0.9.26'),installedBuild,installedVersion),true);
 assert.equal(canInstallRelease(release('PLEGADOX-20261115-R49','0.9.25'),installedBuild,installedVersion),false);
 assert.equal(canInstallRelease(release('PLEGADOX-20261115-R48','0.9.24'),installedBuild,installedVersion),false);
});
test('fecha posterior gana a numeración de revisión anterior',()=>{
 assert.equal(canInstallRelease(release('PLEGADOX-20261116-R1','1.0.0'),installedBuild,installedVersion),true);
 assert.equal(canInstallRelease(release('PLEGADOX-20261114-R99','5.0.0'),installedBuild,installedVersion),false);
 assert.deepEqual(parseReleaseRevision(installedBuild),{date:20261115,revision:49});
});
test('para nombre de build no comparable exige versión semántica superior',()=>{
 assert.equal(canInstallRelease(release('PLEGADOX-LATEST-BETA','1.0.0'),installedBuild,installedVersion),true);
 assert.equal(canInstallRelease(release('PLEGADOX-LATEST-BETA','0.9.25'),installedBuild,installedVersion),false);
});
