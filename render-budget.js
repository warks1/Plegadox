export function renderBudget(mode='auto',device={}){
 const limited=mode==='light'||(mode==='auto'&&(
  (Number.isFinite(device.memory)&&device.memory<=4)||
  (Number.isFinite(device.cores)&&device.cores<=4)));
 return limited?{pixelRatio:1,machineMs:100,sceneMs:200,statusMs:400}:
  {pixelRatio:2,machineMs:64,sceneMs:100,statusMs:250};
}
