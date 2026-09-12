import { guardarDato, escucharDato } from './firebase.js';

const SALDO_OBJETIVO = 25000;
const fmt = n => '$' + (Number(n)||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

let inventario = [];
let movimientos = [];
let cierres = [];
let retiros = [];
let categorias = [];
let contactos = [];
let productoSeleccionado = null; // {nombre, icono}
let mesVisto = new Date();
mesVisto.setDate(1);
mesVisto.setHours(0,0,0,0);
let categoriasListas = false; // evita crear los productos por defecto más de una vez

async function guardar(key, data){
  try{ await guardarDato(key, data); }
  catch(e){ console.error('Error guardando', key, e); }
}

// Escucha en tiempo real: cada vez que CUALQUIER persona conectada guarda algo,
// todos los demás lo ven reflejado al instante, sin necesidad de recargar la página.
function iniciarSincronizacion(){
  escucharDato('inventario', (data)=>{
    inventario = data || [];
    renderInventario();
  });

  escucharDato('movimientos', (data)=>{
    movimientos = data || [];
    renderMovimientos();
    renderDiferencia();
  });

  escucharDato('cierres', (data)=>{
    cierres = data || [];
    renderHistorialCierres();
  });

  escucharDato('retiros', (data)=>{
    retiros = data || [];
    renderHistorialRetiros();
  });

  escucharDato('contactos', (data)=>{
    contactos = data || [];
    renderContactos();
  });

  escucharDato('categoriasIngreso', (data)=>{
    if(data && data.length){
      categorias = data;
      categoriasListas = true;
      renderChipGrid();
    }else if(!categoriasListas){
      categorias = [
        {id:uid(), nombre:'Comino', icono:'🌾'},
        {id:uid(), nombre:'Pimentón', icono:'🌶️'},
        {id:uid(), nombre:'Canela', icono:'🪵'},
        {id:uid(), nombre:'Orégano', icono:'🌿'}
      ];
      categoriasListas = true;
      guardar('categoriasIngreso', categorias);
      renderChipGrid();
    }
  });

  renderControlCaja();
}


// TABS
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab==='cierre') renderDiferencia();
    if(btn.dataset.tab==='control') renderControlCaja();
  });
});

// INVENTARIO
function leerImagen(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderInventario(){
  const el = document.getElementById('tablaInventario');
  if(inventario.length===0){
    el.innerHTML = '<div class="empty">Todavía no cargaste especias.</div>';
    return;
  }
  const tarjetas = inventario.map(it=>{
    const miniatura = it.imagen
      ? `<img src="${it.imagen}" class="stock-img" alt="${it.nombre}">`
      : `<span class="stock-img stock-img-vacia">🧂</span>`;
    return `<div class="stock-card ${it.agotado?'agotado':''}" onclick="abrirEdicionStock('${it.id}')">
      <button type="button" class="stock-card-borrar" onclick="event.stopPropagation(); borrarInv('${it.id}')">×</button>
      ${it.agotado ? '<span class="badge-agotado">Agotado</span>' : ''}
      ${miniatura}
      <div class="stock-nombre">${it.nombre}</div>
      <div class="stock-cantidad">${it.cantidad}</div>
    </div>`;
  }).join('');
  el.innerHTML = `<div class="stock-grid">${tarjetas}</div>`;
}

// selector de unidad de medida (desplegable junto a Cantidad) — alta
let unidadSeleccionada = 'kg';
const btnUnidad = document.getElementById('btnUnidad');
const unidadDropdown = document.getElementById('unidadDropdown');

btnUnidad.addEventListener('click', ()=>{
  unidadDropdown.hidden = !unidadDropdown.hidden;
});
unidadDropdown.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    unidadSeleccionada = btn.dataset.u;
    document.getElementById('unidadLabel').textContent = unidadSeleccionada;
    unidadDropdown.hidden = true;
  });
});

// selector de unidad de medida — edición
let unidadSeleccionadaEdit = 'kg';
const btnUnidadEdit = document.getElementById('btnUnidadEdit');
const unidadDropdownEdit = document.getElementById('unidadDropdownEdit');

btnUnidadEdit.addEventListener('click', ()=>{
  unidadDropdownEdit.hidden = !unidadDropdownEdit.hidden;
});
unidadDropdownEdit.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    unidadSeleccionadaEdit = btn.dataset.u;
    document.getElementById('unidadLabelEdit').textContent = unidadSeleccionadaEdit;
    unidadDropdownEdit.hidden = true;
  });
});

document.addEventListener('click', (e)=>{
  if(!unidadDropdown.hidden && !btnUnidad.contains(e.target) && !unidadDropdown.contains(e.target)){
    unidadDropdown.hidden = true;
  }
  if(!unidadDropdownEdit.hidden && !btnUnidadEdit.contains(e.target) && !unidadDropdownEdit.contains(e.target)){
    unidadDropdownEdit.hidden = true;
  }
});

document.getElementById('btnAddInv').addEventListener('click', async ()=>{
  const nombre = document.getElementById('invNombre').value.trim();
  const cantidadNum = document.getElementById('invCantidadNum').value.trim();
  if(!nombre || !cantidadNum){
    alert('Completá nombre y cantidad.');
    return;
  }
  const cantidad = `${cantidadNum} ${unidadSeleccionada}`;
  const fileInput = document.getElementById('invImagen');
  let imagen = null;
  if(fileInput.files && fileInput.files[0]){
    try{ imagen = await leerImagen(fileInput.files[0]); }catch(e){ imagen = null; }
  }
  inventario.push({id:uid(), nombre, cantidad, imagen, agotado:false});
  await guardar('inventario', inventario);
  renderInventario();
  document.getElementById('invNombre').value='';
  document.getElementById('invCantidadNum').value='';
  fileInput.value='';
});

window.borrarInv = async (id)=>{
  inventario = inventario.filter(i=>i.id!==id);
  await guardar('inventario', inventario);
  renderInventario();
};

// EDICIÓN DE STOCK (modal con opción de agotado)
let edicionActualId = null;
let agotadoTemp = false;

function actualizarBotonAgotado(agotado){
  const btn = document.getElementById('btnToggleAgotado');
  if(agotado){
    btn.textContent = 'Reactivar (ya tengo stock)';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
  }else{
    btn.textContent = 'Marcar como agotado';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-danger');
  }
}

window.abrirEdicionStock = (id)=>{
  const it = inventario.find(i=>i.id===id);
  if(!it) return;
  edicionActualId = id;

  const match = String(it.cantidad).match(/^([\d.,]+)\s*(\S*)/);
  document.getElementById('editCantidadNum').value = match ? match[1].replace(',', '.') : '';
  unidadSeleccionadaEdit = (match && match[2]) ? match[2] : 'kg';
  document.getElementById('unidadLabelEdit').textContent = unidadSeleccionadaEdit;

  document.getElementById('editImagen').value = '';
  agotadoTemp = !!it.agotado;
  actualizarBotonAgotado(agotadoTemp);

  document.getElementById('modalEditarStock').classList.add('mostrar');
};

document.getElementById('btnToggleAgotado').addEventListener('click', ()=>{
  agotadoTemp = !agotadoTemp;
  actualizarBotonAgotado(agotadoTemp);
});

function cerrarModalEdicion(){
  document.getElementById('modalEditarStock').classList.remove('mostrar');
  edicionActualId = null;
}
document.getElementById('btnCancelarEdit').addEventListener('click', cerrarModalEdicion);
document.getElementById('btnCerrarModalX').addEventListener('click', cerrarModalEdicion);

document.getElementById('btnGuardarEdit').addEventListener('click', async ()=>{
  const it = inventario.find(i=>i.id===edicionActualId);
  if(!it) return;
  const cantidadNum = document.getElementById('editCantidadNum').value.trim();
  if(!cantidadNum){
    alert('Completá la cantidad.');
    return;
  }
  it.cantidad = `${cantidadNum} ${unidadSeleccionadaEdit}`;
  it.agotado = agotadoTemp;

  const fileInput = document.getElementById('editImagen');
  if(fileInput.files && fileInput.files[0]){
    try{ it.imagen = await leerImagen(fileInput.files[0]); }catch(e){}
  }

  await guardar('inventario', inventario);
  renderInventario();
  cerrarModalEdicion();
});

// MOVIMIENTOS
function renderMovimientos(){
  renderGraficoMovimientos();
  const el = document.getElementById('tablaMovimientos');
  if(movimientos.length===0){
    el.innerHTML = '<div class="empty">No hay movimientos registrados en este turno.</div>';
    return;
  }
  let rows = movimientos.slice().reverse().map(m=>{
    const d = new Date(m.fecha);
    const fecha = d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
    const hora = d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    const metodoTxt = m.metodo==='transferencia' ? 'Transferencia' : 'Efectivo';
    return `<tr>
      <td><span class="pill ${m.tipo}">${m.tipo==='egreso'?'Gasto':'Ingreso'}</span></td>
      <td>${m.concepto}</td>
      <td class="num">${fmt(m.monto)}</td>
      <td><span class="pill metodo">${metodoTxt}</span></td>
      <td class="num">${fecha}</td>
      <td class="num">${hora}</td>
      <td><button class="btn-ghost" onclick="borrarMov('${m.id}')">Quitar</button></td>
    </tr>`;
  }).join('');
  el.innerHTML = `<table>
    <tr><th>Tipo</th><th>Concepto</th><th class="num">Monto</th><th>Método</th><th class="num">Fecha</th><th class="num">Hora</th><th></th></tr>
    ${rows}
  </table>`;
}

function formatMes(d){
  const txt = d.toLocaleDateString('es-AR',{month:'long', year:'numeric'});
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// genera una curva suave (spline) que pasa por todos los puntos, en vez de líneas rectas
function pathSuave(pts){
  if(pts.length < 2) return '';
  if(pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0; i<pts.length-1; i++){
    const p0 = pts[i===0 ? 0 : i-1];
    const p1 = pts[i];
    const p2 = pts[i+1];
    const p3 = pts[i+2 < pts.length ? i+2 : i+1];
    const cp1x = p1[0] + (p2[0]-p0[0])/6;
    const cp1y = p1[1] + (p2[1]-p0[1])/6;
    const cp2x = p2[0] - (p3[0]-p1[0])/6;
    const cp2y = p2[1] - (p3[1]-p1[1])/6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

document.getElementById('mesPrev').addEventListener('click', ()=>{
  mesVisto.setMonth(mesVisto.getMonth()-1);
  renderGraficoMovimientos();
});
document.getElementById('mesNext').addEventListener('click', ()=>{
  mesVisto.setMonth(mesVisto.getMonth()+1);
  renderGraficoMovimientos();
});

function renderGraficoMovimientos(){
  const el = document.getElementById('graficoMovimientos');
  if(!el) return;
  document.getElementById('mesLabel').textContent = formatMes(mesVisto);

  const year = mesVisto.getFullYear(), month = mesVisto.getMonth();
  const diasEnMes = new Date(year, month+1, 0).getDate();

  const delMes = movimientos.filter(m=>{
    const d = new Date(m.fecha);
    return d.getFullYear()===year && d.getMonth()===month;
  });

  const totalIngresos = delMes.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a+m.monto,0);
  const totalGastos = delMes.filter(m=>m.tipo==='egreso').reduce((a,m)=>a+m.monto,0);
  document.getElementById('resumenIngresos').textContent = fmt(totalIngresos);
  document.getElementById('resumenGastos').textContent = fmt(totalGastos);
  document.getElementById('resumenSaldoMes').textContent = fmt(totalIngresos - totalGastos);

  if(delMes.length===0){
    el.innerHTML = '<div class="chart-empty">Todavía no hay movimientos cargados este mes.</div>';
    return;
  }

  const netoPorDia = new Array(diasEnMes+1).fill(0);
  delMes.forEach(m=>{
    const dia = new Date(m.fecha).getDate();
    netoPorDia[dia] += (m.tipo==='ingreso' ? m.monto : -m.monto);
  });

  let acumulado = 0;
  const puntos = [0];
  for(let d=1; d<=diasEnMes; d++){
    acumulado += netoPorDia[d];
    puntos.push(acumulado);
  }

  const w=700, h=220, padL=58, padR=14, padT=16, padB=26;
  const innerW=w-padL-padR, innerH=h-padT-padB;
  const n=puntos.length; // diasEnMes + 1
  const maxV=Math.max(...puntos,0);
  const minV=Math.min(...puntos,0);
  const rango=(maxV-minV)||1;
  const x=i=> padL + innerW*(i/diasEnMes);
  const y=v=> padT + innerH - ((v-minV)/rango)*innerH;

  const coords = puntos.map((v,i)=>[x(i), y(v)]);
  const linePath = pathSuave(coords);
  const base = (padT+innerH).toFixed(1);
  const areaPath = `${linePath} L${x(n-1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;

  const fmtEje = v => (v<0?'-':'') + '$' + Math.abs(Math.round(v)).toLocaleString('es-AR');

  let grid='';
  const gridCount=4;
  for(let g=0; g<=gridCount; g++){
    const val = minV + (rango*g/gridCount);
    const yy = y(val);
    grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${w-padR}" y2="${yy.toFixed(1)}" stroke="rgba(243,230,208,.14)" stroke-dasharray="3,4"/>`;
    grid += `<text x="${padL-8}" y="${(yy+4).toFixed(1)}" text-anchor="end" font-size="11" fill="rgba(243,230,208,.55)">${fmtEje(val)}</text>`;
  }

  // marcas de días: 1, 5, 10, 15, 20, 25, 30... y el último día del mes
  let ticks = [1];
  for(let d=5; d<=diasEnMes; d+=5) ticks.push(d);
  if(ticks[ticks.length-1] !== diasEnMes) ticks.push(diasEnMes);

  let xLabels='';
  ticks.forEach(dia=>{
    xLabels += `<text x="${x(dia).toFixed(1)}" y="${h-6}" text-anchor="middle" font-size="11" fill="rgba(243,230,208,.55)">${dia}</text>`;
  });

  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4941e" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#d4941e" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${areaPath}" fill="url(#areaGrad)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="#d4941e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${xLabels}
  </svg>`;
}

// mostrar/ocultar concepto según el tipo de movimiento
function actualizarCampoConcepto(){
  const tipo = document.getElementById('movTipo').value;
  const esIngreso = tipo === 'ingreso';
  document.getElementById('campoConceptoGasto').style.display = esIngreso ? 'none' : '';
  document.getElementById('campoConceptoIngreso').style.display = esIngreso ? '' : 'none';
  if(!esIngreso){
    document.getElementById('panelProductos').hidden = true;
  }
}
document.getElementById('movTipo').addEventListener('change', actualizarCampoConcepto);
actualizarCampoConcepto();

// panel de productos (chips)
document.getElementById('btnAbrirProductos').addEventListener('click', ()=>{
  const panel = document.getElementById('panelProductos');
  panel.hidden = !panel.hidden;
  if(!panel.hidden) renderChipGrid();
});

function renderChipGrid(){
  const grid = document.getElementById('chipGrid');
  if(!grid) return;
  const chips = categorias.map(c => `
    <button type="button" class="chip-item" data-id="${c.id}">
      <span class="chip-icon">${c.icono}</span>
      <span class="chip-label">${c.nombre}</span>
    </button>
  `).join('');
  grid.innerHTML = chips + `
    <button type="button" class="chip-item add" id="chipAgregar">
      <span class="chip-icon">+</span>
      <span class="chip-label">Agregar</span>
    </button>
  `;
  grid.querySelectorAll('.chip-item[data-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cat = categorias.find(c=>c.id===btn.dataset.id);
      if(!cat) return;
      productoSeleccionado = {nombre:cat.nombre, icono:cat.icono};
      document.getElementById('productoIconoSel').textContent = cat.icono;
      document.getElementById('productoTextoSel').textContent = cat.nombre;
      document.getElementById('panelProductos').hidden = true;
      document.getElementById('chipAddForm').hidden = true;
    });
  });
  document.getElementById('chipAgregar').addEventListener('click', ()=>{
    const form = document.getElementById('chipAddForm');
    form.hidden = !form.hidden;
  });
}

document.getElementById('btnGuardarProducto').addEventListener('click', async ()=>{
  const icono = document.getElementById('nuevoProductoIcono').value.trim() || '🧂';
  const nombre = document.getElementById('nuevoProductoNombre').value.trim();
  if(!nombre){
    alert('Ponele un nombre al producto.');
    return;
  }
  const nuevo = {id:uid(), nombre, icono};
  categorias.push(nuevo);
  await guardar('categoriasIngreso', categorias);
  document.getElementById('nuevoProductoIcono').value='';
  document.getElementById('nuevoProductoNombre').value='';
  document.getElementById('chipAddForm').hidden = true;
  renderChipGrid();
  // seleccionamos directo el que acabamos de crear
  productoSeleccionado = {nombre:nuevo.nombre, icono:nuevo.icono};
  document.getElementById('productoIconoSel').textContent = nuevo.icono;
  document.getElementById('productoTextoSel').textContent = nuevo.nombre;
  document.getElementById('panelProductos').hidden = true;
});

document.getElementById('btnAddMov').addEventListener('click', async ()=>{
  const tipo = document.getElementById('movTipo').value;
  const monto = parseFloat(document.getElementById('movMonto').value);
  const metodo = document.getElementById('movMetodo').value;
  let concepto = '';

  if(tipo === 'ingreso'){
    if(!productoSeleccionado){
      alert('Elegí un producto para el ingreso.');
      return;
    }
    concepto = productoSeleccionado.nombre;
  }else{
    concepto = document.getElementById('movConcepto').value.trim();
    if(!concepto){
      alert('Completá el concepto del gasto.');
      return;
    }
  }

  if(isNaN(monto) || monto<=0){
    alert('Ingresá un monto válido.');
    return;
  }

  movimientos.push({id:uid(), tipo, concepto, monto, metodo, fecha:Date.now()});
  await guardar('movimientos', movimientos);
  renderMovimientos();

  document.getElementById('movConcepto').value='';
  document.getElementById('movMonto').value='';
  productoSeleccionado = null;
  document.getElementById('productoIconoSel').textContent = '+';
  document.getElementById('productoTextoSel').textContent = 'Elegir producto';
});

window.borrarMov = async (id)=>{
  movimientos = movimientos.filter(m=>m.id!==id);
  await guardar('movimientos', movimientos);
  renderMovimientos();
};

// CIERRE DE CAJA
// formato con punto de miles mientras se escribe (ej: 1.000 / 100.000)
function formatearMiles(valor){
  let limpio = valor.replace(/[^0-9,]/g,'');
  let [entero, decimal] = limpio.split(',');
  entero = entero.replace(/^0+(?=\d)/,'');
  let enteroFmt = entero ? Number(entero).toLocaleString('es-AR') : '';
  let resultado = enteroFmt;
  if(decimal !== undefined) resultado += ',' + decimal.slice(0,2);
  return resultado;
}
function parsearMiles(valor){
  if(!valor) return 0;
  const limpio = valor.replace(/\./g,'').replace(',','.');
  return parseFloat(limpio) || 0;
}
document.querySelectorAll('input.miles').forEach(el=>{
  el.addEventListener('input', ()=>{
    el.value = formatearMiles(el.value);
    renderDiferencia();
  });
});

function leerCierreInputs(){
  const inicial = parsearMiles(document.getElementById('cInicial').value);
  const gastos = parsearMiles(document.getElementById('cGastos').value);
  const extras = parsearMiles(document.getElementById('cExtras').value);
  const final = parsearMiles(document.getElementById('cFinal').value);
  const diferencia = inicial - gastos + extras + final;
  return {inicial, gastos, extras, final, diferencia};
}

function renderDiferencia(){
  const {diferencia} = leerCierreInputs();
  document.getElementById('cDiferencia').textContent = fmt(diferencia);
}

document.getElementById('btnCerrarCaja').addEventListener('click', async ()=>{
  const {inicial, gastos, extras, final, diferencia} = leerCierreInputs();
  const resEl = document.getElementById('resultadoCierre');
  const negativo = diferencia < 0;
  resEl.innerHTML = `<div class="close-result ${negativo?'negativo':''}">
    <b>Diferencia: ${fmt(diferencia)}</b><br>
    Saldo inicial ${fmt(inicial)} · Gastos ${fmt(gastos)} · Extras ${fmt(extras)} · Saldo final ${fmt(final)}
  </div>`;

  cierres.push({
    id:uid(),
    fecha:Date.now(),
    inicial,
    gastos,
    extras,
    final,
    diferencia
  });
  await guardar('cierres', cierres);
  renderHistorialCierres();

  document.getElementById('cInicial').value='';
  document.getElementById('cGastos').value='';
  document.getElementById('cExtras').value='';
  document.getElementById('cFinal').value='';
  renderDiferencia();
});

function renderHistorialCierres(){
  const el = document.getElementById('historialCierres');
  if(cierres.length===0){
    el.innerHTML = '<div class="empty">Todavía no hiciste ningún cierre.</div>';
    return;
  }
  el.innerHTML = cierres.slice().reverse().map(c=>{
    const fechaTxt = new Date(c.fecha).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    const dif = c.diferencia;
    const texto = 'Diferencia: '+fmt(dif);
    return `<div class="hist-item">
      <span>${fechaTxt} — Inicial ${fmt(c.inicial)} · Gastos ${fmt(c.gastos)} · Extras ${fmt(c.extras)} · Final ${fmt(c.final)}</span>
      <span class="meta">${texto}</span>
    </div>`;
  }).join('');
}

// CONTROL DE CAJA — retiro cada 2 días para volver al saldo objetivo
document.getElementById('ctrlGanancia').addEventListener('input', e=>{
  e.target.value = formatearMiles(e.target.value);
  renderControlCaja();
});

function renderControlCaja(){
  const ganancia = parsearMiles(document.getElementById('ctrlGanancia').value);
  const sacar = ganancia - SALDO_OBJETIVO;
  document.getElementById('ctrlSacar').textContent = fmt(sacar);
  document.getElementById('ctrlQueda').textContent = fmt(SALDO_OBJETIVO);
}

document.getElementById('btnRetiroCaja').addEventListener('click', async ()=>{
  const ganancia = parsearMiles(document.getElementById('ctrlGanancia').value);
  if(ganancia<=0){
    alert('Ingresá el monto de estos días.');
    return;
  }
  const sacar = ganancia - SALDO_OBJETIVO;
  const resEl = document.getElementById('resultadoRetiro');
  const negativo = sacar < 0;
  resEl.innerHTML = `<div class="close-result ${negativo?'negativo':''}">
    <b>${negativo ? 'Todavía no llegás a los '+fmt(SALDO_OBJETIVO) : 'Sacá '+fmt(sacar)}</b><br>
    ${negativo ? 'Te faltan '+fmt(Math.abs(sacar))+' para llegar al saldo inicial.' : 'Así te quedan '+fmt(SALDO_OBJETIVO)+' de saldo inicial para arrancar.'}
  </div>`;

  retiros.push({id:uid(), fecha:Date.now(), ganancia, saco:sacar, queda:SALDO_OBJETIVO});
  await guardar('retiros', retiros);
  renderHistorialRetiros();
});

document.getElementById('btnLimpiarRetiro').addEventListener('click', ()=>{
  document.getElementById('ctrlGanancia').value='';
  document.getElementById('resultadoRetiro').innerHTML='';
  renderControlCaja();
});

function renderHistorialRetiros(){
  const el = document.getElementById('historialRetiros');
  if(retiros.length===0){
    el.innerHTML = '<div class="empty">Todavía no registraste ningún retiro.</div>';
    return;
  }
  el.innerHTML = retiros.slice().reverse().map(r=>{
    const fechaTxt = new Date(r.fecha).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    return `<div class="hist-item">
      <span>${fechaTxt} — Ganancia ${fmt(r.ganancia)}</span>
      <span class="meta">Sacaste ${fmt(r.saco)} · quedaron ${fmt(r.queda)}</span>
    </div>`;
  }).join('');
}

// AGENDA DE CONTACTO (burbuja arriba a la derecha)
function escaparTexto(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function copiarTexto(texto, btn){
  const hacerFallback = ()=>{
    const temp = document.createElement('textarea');
    temp.value = texto;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(temp);
  };
  const avisarCopiado = ()=>{
    if(!btn) return;
    const original = btn.textContent;
    btn.textContent = 'Copiado ✓';
    btn.classList.add('copiado');
    setTimeout(()=>{
      btn.textContent = original;
      btn.classList.remove('copiado');
    }, 1200);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(texto).then(avisarCopiado).catch(()=>{
      hacerFallback();
      avisarCopiado();
    });
  }else{
    hacerFallback();
    avisarCopiado();
  }
}

function renderContactos(){
  const el = document.getElementById('listaContactos');
  if(contactos.length===0){
    el.innerHTML = '<div class="empty">Todavía no agendaste contactos.</div>';
    return;
  }
  el.innerHTML = contactos.slice().reverse().map(c=>`
    <div class="contacto-item">
      <div class="contacto-linea">
        <span class="contacto-label">Nombre</span>
        <span class="contacto-valor">${escaparTexto(c.nombre)}</span>
        <button type="button" class="btn-copiar" data-copy="${escaparTexto(c.nombre)}">Copiar</button>
      </div>
      <div class="contacto-linea">
        <span class="contacto-label">Teléfono</span>
        <span class="contacto-valor">${escaparTexto(c.telefono)}</span>
        <button type="button" class="btn-copiar" data-copy="${escaparTexto(c.telefono)}">Copiar</button>
      </div>
      <div class="contacto-linea">
        <span class="contacto-label">Ciudad</span>
        <span class="contacto-valor">${c.ciudad ? escaparTexto(c.ciudad) : '—'}</span>
      </div>
      <div class="contacto-linea">
        <span class="contacto-label">Info</span>
        <span class="contacto-valor">${c.informacion ? escaparTexto(c.informacion) : '—'}</span>
      </div>
      <button type="button" class="btn-ghost" onclick="borrarContacto('${c.id}')">Quitar contacto</button>
    </div>
  `).join('');
  el.querySelectorAll('.btn-copiar').forEach(btn=>{
    btn.addEventListener('click', ()=> copiarTexto(btn.dataset.copy, btn));
  });
}

document.getElementById('btnAbrirContacto').addEventListener('click', ()=>{
  document.getElementById('modalContacto').classList.add('mostrar');
});
document.getElementById('btnCerrarContacto').addEventListener('click', ()=>{
  document.getElementById('modalContacto').classList.remove('mostrar');
});

document.getElementById('btnGuardarContacto').addEventListener('click', async ()=>{
  const nombre = document.getElementById('contNombre').value.trim();
  const telefono = document.getElementById('contTelefono').value.trim();
  const ciudad = document.getElementById('contCiudad').value.trim();
  const informacion = document.getElementById('contInfo').value.trim();
  if(!nombre || !telefono){
    alert('Completá al menos el nombre y el teléfono.');
    return;
  }
  contactos.push({id:uid(), nombre, telefono, ciudad, informacion});
  await guardar('contactos', contactos);
  renderContactos();
  document.getElementById('contNombre').value='';
  document.getElementById('contTelefono').value='';
  document.getElementById('contCiudad').value='';
  document.getElementById('contInfo').value='';
});

window.borrarContacto = async (id)=>{
  contactos = contactos.filter(c=>c.id!==id);
  await guardar('contactos', contactos);
  renderContactos();
};

iniciarSincronizacion();
