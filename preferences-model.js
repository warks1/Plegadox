export const PREFERENCE_FIELDS=Object.freeze({
 performance:{label:'Rendimiento gráfico',values:{auto:'Automático',light:'Ligero · tablet',quality:'Calidad máxima'},default:'auto'},
 textSize:{label:'Texto en controles',values:{standard:'Estándar',large:'Grande',extra:'Muy grande'},default:'standard'},
 density:{label:'Tamaño de botones',values:{standard:'Estándar',touch:'Táctil amplio'},default:'standard'},
 contrast:{label:'Bordes y foco',values:{standard:'Estándar',strong:'Reforzados'},default:'standard'},
 motion:{label:'Animación de interfaz',values:{system:'Según dispositivo',reduce:'Reducida'},default:'system'},
 scroll:{label:'Desplazamiento de página',values:{auto:'Inmediato',smooth:'Suave'},default:'auto'},
 numbers:{label:'Cifras en controles',values:{standard:'Estándar',tabular:'Alineadas'},default:'standard'},
 speed:{label:'Velocidad de simulación al abrir',values:{'.5':'0,5×','1':'1×','1.5':'1,5×','2':'2×'},default:'1'},
 startup:{label:'Pantalla de inicio',values:{simulacion:'Programa',programacion:'Editar pieza',herramientas:'Herramientas',desarrollo:'Desarrollo',maquina:'Máquina',software:'Software'},default:'simulacion'},
 shortcuts:{label:'Atajos de teclado',values:{off:'Desactivados',on:'Activados'},default:'off'},
 backgroundPause:{label:'Al cambiar de aplicación',values:{on:'Pausar simulación',off:'Mantener comportamiento actual'},default:'on'},
 focus:{label:'Indicador de foco de teclado',values:{standard:'Estándar',strong:'Ampliado'},default:'standard'}
});
export function normalizePreferences(input={}){
 return Object.fromEntries(Object.entries(PREFERENCE_FIELDS).map(([key,field])=>
  [key,Object.hasOwn(field.values,input?.[key])?String(input[key]):field.default]));
}
export function parsePreferences(text){
 if(text.length>65536)throw Error('El archivo supera 64 KB.');
 const data=JSON.parse(text);
 if(data?.format!=='plegadox-preferences'||data.version!==1||!data.preferences||typeof data.preferences!=='object'||Array.isArray(data.preferences))throw Error('Archivo de preferencias no reconocido.');
 return {preferences:normalizePreferences(data.preferences),view:data.view};
}
