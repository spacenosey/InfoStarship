(()=>{
  const D=window.STARSHIP_DATA||[],
        S=document.querySelector("#v"),
        T=document.querySelector("#tip"),
        state=document.querySelector("#state"),
        W=1700,
        H=980;

const uniq=a=>[...new Set(a.filter(x=>x!==null&&x!==undefined&&String(x).trim()!=="").map(String))];
  const M=D.map((d,i)=>({...d,i})), 
        rawShips=uniq(M.map(d=>d.ship)), 
        rawBoosters=uniq(M.map(d=>d.booster));

  // Mapa de cada Booster a su versión
  const shipVersionMap = new Map(M.map(d => [d.ship, d.version || "V1"]));
  const boosterVersionMap = new Map(M.map(d => [d.booster, d.version || "V1"]));
  
// Ordenar Starships por versión y luego por número
  const ships = rawShips.sort((a, b) => {
    const vA = shipVersionMap.get(a) || "";
    const vB = shipVersionMap.get(b) || "";
    if (vA !== vB) return vA.localeCompare(vB);
    return a.localeCompare(b, undefined, { numeric: true });
  });

  // Ordenar boosters primero por versión y luego por número
  const boosters = rawBoosters.sort((a, b) => {
    const vA = boosterVersionMap.get(a) || "";
    const vB = boosterVersionMap.get(b) || "";
    if (vA !== vB) return vA.localeCompare(vB);
    return a.localeCompare(b, undefined, { numeric: true });
  });

// --- POSICIONES HORIZONTALES (X) ---
  const sx=new Map(ships.map((x,i)=>[x,180+i*(W-360)/Math.max(1,ships.length-1)]));
  const bx=new Map(boosters.map((x,i)=>[x,180+i*(W-360)/Math.max(1,boosters.length-1)]));

  const dates = M.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dates), maxDate = Math.max(...dates);
  const mx = new Map(M.map(d => {
    const t = new Date(d.date).getTime();
    const x = 160 + ((t - minDate) / (maxDate - minDate)) * (W - 320);
    return [d.id, x];
  }));

  // --- MAPA DE COLORES UNIFORMES POR BOOSTER (DEGRADADO HORIZONTAL) ---
  const boosterColorMap = new Map();
  const numBoosters = boosters.length;

  boosters.forEach((b, index) => {
    // Proporción de 0 a 1 según la posición horizontal (de izquierda a derecha)
    const pct = numBoosters > 1 ? index / (numBoosters - 1) : 0;
    
    // Mapeo en el espacio de color HSL:
    // 190° (Azul Cyan) -> 280° (Violeta Neón) / 320° (Rosa)
    const hue = 190 + pct * 130; 
    const color = `hsl(${hue}, 85%, 60%)`;
    
    boosterColorMap.set(b, color);
  });

  // --- POSICIONES VERTICALES COMPACTAS (Y) ---
  const Y_TIMELINE_TOP = 55;     
  const Y_TIMELINE_BOTTOM = 370; 
  const Y_STARSHIP = 460;        
  const Y_BOOSTER  = 660;        

  const my = new Map(M.map(d => {
    const dateObj = new Date(d.date);
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    const monthFraction = month + (day / 31);
    const y = Y_TIMELINE_TOP + (monthFraction / 12) * (Y_TIMELINE_BOTTOM - Y_TIMELINE_TOP);
    return [d.id, y];
  }));

  let E=[];
  const esc=x=>String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  
  function path(x1,y1,x2,y2){
    const dy=(y2-y1)*2;
    return `M${x1},${y1} C${x1},${y1+dy*.30} ${x2},${y2-dy*.30} ${x2},${y2}`;
  }
  
  function add(tag,attrs,txt=""){
    const e=document.createElementNS("http://www.w3.org/2000/svg",tag);
    for(const k in attrs) e.setAttribute(k,attrs[k]);
    if(txt) e.textContent=txt;
    S.appendChild(e);
    return e;
  }

  S.setAttribute("viewBox", `0 0 ${W} ${H}`);
  S.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Fondo canvas
  add("rect",{x:0,y:0,width:W,height:H,fill:"#080b10"});

  // Títulos de secciones
  ["TIMELINE & MISSIONS","STARSHIPS","BOOSTERS","LAUNCH SITES"].forEach((x,i)=>
    add("text",{x:45,y:[24,430,630,795][i],class:"sec"},x)
  );

  // Rejilla de fondo
  for(let y=25;y<800;y+=45) add("path",{d:`M0 ${y}H${W}`,class:"grid"});

  // --- CONTENEDOR DESTACADO PARA LA LÍNEA TEMPORAL Y MISIONES ---
  add("rect", {
    x: 100,
    y: Y_TIMELINE_TOP - 10,
    width: W - 110,
    height: (Y_TIMELINE_BOTTOM - Y_TIMELINE_TOP) + 20,
    rx: 8,
    fill: "#111827",          // Azul/Gris muy oscuro para destacar sobre el fondo negro
    stroke: "#3b82f6",        // Borde azul brillante
    "stroke-width": 1.5,
    "stroke-dasharray": "6 4", // Borde punteado
    opacity: 0.8
  });

  // --- IMAGEN ICONOGRÁFICA DE STARSHIP EN EL LATERAL IZQUIERDO ---
  add("image",{
    "href": "img/videoframe_14395-removebg-preview.png",
    "x": -40,
    "y": 250,
    "width": 119,
    "height": 368,
    "preserveAspectRatio": "xMidYMid meet"
  });

  // --- IMAGEN ICONOGRÁFICA DEL SUPER HEAVY (BOOSTER) EN EL LATERAL IZQUIERDO ---
  add("image",{
    "href": "img/videoframe_7421-removebg-preview.png",
    "x": -73,
    "y": 330,
    "width": 185,
    "height": 577,
    "preserveAspectRatio": "xMidYMid meet"
  });

// 1. Línea Temporal Superior (Años dinámicos)
  add("path",{d:`M120 ${Y_TIMELINE_TOP - 20} H${W-100}`,class:"line",style:"stroke-width:1.5; opacity:0.4;"});

  // Obtener el año mínimo y máximo automáticamente a partir de las fechas de tus datos
  const minYear = new Date(minDate).getFullYear();
  const maxYear = new Date(maxDate).getFullYear();

  // Generar la lista de años entre el primero y el último
  const years = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  years.forEach(year => {
    const tYear = new Date(`${year}-01-01`).getTime();
    if(tYear >= minDate && tYear <= maxDate){
      const xYear = 160 + ((tYear - minDate) / (maxDate - minDate)) * (W - 320);
      add("path",{d:`M${xYear} ${Y_TIMELINE_TOP - 25} V${Y_TIMELINE_TOP - 15}`,class:"line",style:"opacity:0.6;"});
      
      add("text",{
        x: xYear, 
        y: Y_TIMELINE_TOP - 30, 
        "text-anchor": "middle", 
        class: "small", 
        style: "fill: #c0c9d6; font-size: 14px; font-weight;" 
      }, year);
    }
  });

  // 2. Línea Temporal Vertical Izquierda (Meses)
  const X_MONTH_AXIS = 90;
  add("path",{d:`M${X_MONTH_AXIS} ${Y_TIMELINE_TOP} V${Y_TIMELINE_BOTTOM}`,class:"line",style:"stroke-width:1.5; opacity:0.4;"});

  const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  monthNames.forEach((m, idx) => {
    const yMonth = Y_TIMELINE_TOP + (idx / 11) * (Y_TIMELINE_BOTTOM - Y_TIMELINE_TOP);
    add("path",{d:`M${X_MONTH_AXIS - 4} ${yMonth} H${X_MONTH_AXIS + 4}`,class:"line",style:"opacity:0.6;"});
    add("text",{x:X_MONTH_AXIS - 10, y:yMonth + 3, "text-anchor":"end", class:"small", style:"fill:#737d8a; font-size:11px;"}, m);
  });

  // MAPA INFERIOR COMPACTO
  const mxMap=45, myMap=815, mwMap=W-90, mhMap=145;
  add("rect",{x:mxMap, y:myMap, width:mwMap, height:mhMap, rx:4, class:"map"});
  
  for(let x=mxMap+100; x<mxMap+mwMap; x+=120) add("path",{d:`M${x} ${myMap}V${myMap+mhMap}`,class:"grid"});
  for(let y=myMap+30; y<myMap+mhMap; y+=30) add("path",{d:`M${mxMap} ${y}H${mxMap+mwMap}`,class:"grid"});

  const coastPath = `
    M ${mxMap + 100}, ${myMap + mhMap - 5} 
    L ${mxMap + 220}, ${myMap + 120} 
    Q ${mxMap + 380}, ${myMap + 120} ${mxMap + 480}, ${myMap + 105} 
    C ${mxMap + 600}, ${myMap + 90} ${mxMap + 700}, ${myMap + 40} ${mxMap + 820}, ${myMap + 55}
    Q ${mxMap + 870}, ${myMap + 100} ${mxMap + 920}, ${myMap + 80}
    C ${mxMap + 1050}, ${myMap + 45} ${mxMap + 1180}, ${myMap + 40} ${mxMap + 1280}, ${myMap + 40}
    Q ${mxMap + 1340}, ${myMap + 65} ${mxMap + 1380}, ${myMap + 105}
    Q ${mxMap + 1410}, ${myMap + 135} ${mxMap + 1440}, ${myMap + 140}
    L ${mxMap + 1480}, ${myMap + 105}
    Q ${mxMap + 1460}, ${myMap + 55} ${mxMap + 1430}, ${myMap + 30}
    L ${mxMap + mwMap}, ${myMap + 30}
  `;
  add("path",{d: coastPath, class:"coast", style:"stroke-width: 2; stroke: #323d4d; fill: none;"});
  add("text",{x: mxMap + 720, y: myMap + 115, "text-anchor":"middle", class:"small", style:"fill:#2d3846; font-size:11px; font-weight:bold; letter-spacing:4px;"}, "GULF OF MEXICO");

  const siteCoords = {
    starbase: { id: "starbase", name: "STARBASE", sub: "Texas", x: mxMap + 320, y: myMap + 110, active: true },
    louisiana: { id: "louisiana", name: "STARBASE", sub: "LOUISIANA", x: mxMap + 880, y: myMap + 60, active: false },
    cape: { id: "cape", name: "KENNEDY SPACE CENTER", sub: "FLORIDA", x: mxMap + 1425, y: myMap + 78, active: false }
  };

  function getSitePos(siteText) {
    const s = String(siteText || "").toLowerCase();
    if(s.includes("florida") || s.includes("cape") || s.includes("cañaveral")) return siteCoords.cape;
    if(s.includes("louisiana") || s.includes("michoud")) return siteCoords.louisiana;
    return siteCoords.starbase;
  }

  // Helper formateador simple MM/DD/YYYY
  function formatDateMMDDYYYY(dateStr) {
    if (!dateStr) return "";
    // Si ya es MM/DD/YYYY (ej. "04/20/2023")
    if (dateStr.includes("/")) return dateStr.split(" ")[0];
    // Si viene en formato ISO (ej. "2023-04-20")
    const parts = dateStr.split(" ")[0].split("-");
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return dateStr;
    }

  Object.values(siteCoords).forEach(s => {
    add("circle",{cx: s.x, cy: s.y, r: 12, fill: "none", stroke: s.active ? "#38ef7d" : "#4a5568", "stroke-width": 1.5, opacity: 0.5});
    const e = add("circle",{cx: s.x, cy: s.y, r: 6, fill: s.active ? "#38ef7d" : "#8a96a3", class:"dot siteDot node"});
    e.dataset.t = s.id;
    add("text",{x: s.x, y: s.y - 16, "text-anchor":"middle", class:"label", style:`font-weight:bold; fill:${s.active ? '#fff' : '#a0aec0'};`}, s.name);
    add("text",{x: s.x, y: s.y - 5, "text-anchor":"middle", class:"small", style:"fill:#64748b; font-size:9px;"}, s.sub);
  });

  // CONEXIONES
  M.forEach((d, i) => {
    const missionX = mx.get(d.id);
    const missionY = my.get(d.id);
    const sitePos = getSitePos(d.site);
    d.siteId = sitePos.id;

    // Obtener el color único asignado al Booster de esta misión
    const lineColor = boosterColorMap.get(d.booster) || "#38bdf8";

    // 1. Línea Launch Site -> Booster
    const lineSiteToBooster = add("path", {
      d: path(sitePos.x, sitePos.y, bx.get(d.booster), Y_BOOSTER),
      class: "line",
      fill: "none",
      style: `stroke: ${lineColor}; stroke-width: 1.2px;`
    });

    // 2. Línea Booster -> Starship
    const lineBoosterToShip = add("path", {
      d: path(bx.get(d.booster), Y_BOOSTER, sx.get(d.ship), Y_STARSHIP),
      class: "line",
      fill: "none",
      style: `stroke: ${lineColor}; stroke-width: 1.2px;`
    });
    
    // 3. Línea Starship -> Misión
    const lineShipToMission = add("path", {
      d: path(sx.get(d.ship), Y_STARSHIP, missionX, missionY),
      class: "line",
      fill: "none",
      style: `stroke: ${lineColor}; stroke-width: 1.2px;`
    });
    
    E.push({e: lineSiteToBooster, m: d.id, siteId: sitePos.id, ship: d.ship, booster: d.booster});
    E.push({e: lineBoosterToShip, m: d.id, siteId: sitePos.id, ship: d.ship, booster: d.booster});
    E.push({e: lineShipToMission, m: d.id, siteId: sitePos.id, ship: d.ship, booster: d.booster});
  });

  // Nodos de STARSHIPS
  ships.forEach((x,i)=>{
    const e=add("circle",{cx:sx.get(x),cy:Y_STARSHIP,r:8,class:"dot shipDot node"});
    e.dataset.t=x;
    add("text",{x:sx.get(x),y:Y_STARSHIP-14,"text-anchor":"middle",class:"label"},x);
  });

  // --- AGRUPAMIENTO VISUAL DE STARSHIPS POR VARIANTE ---
  const shipVersionGroups = new Map();
  ships.forEach(s => {
    const fullVersion = shipVersionMap.get(s) || "V1";
    const variantLabel = fullVersion.includes(" ") ? fullVersion.split(" ").pop() : fullVersion;
    
    if (!shipVersionGroups.has(variantLabel)) shipVersionGroups.set(variantLabel, []);
    shipVersionGroups.get(variantLabel).push(s);
  });

  // --- AGRUPAMIENTO VISUAL DE BOOSTERS POR VERSIÓN ---
  const versionGroups = new Map();
  boosters.forEach(b => {
    // Si viene "Starship V1", extrae solo "V1". Si ya viene como "V1", lo conserva.
    const fullVersion = boosterVersionMap.get(b) || "V1";
    const variantLabel = fullVersion.includes(" ") ? fullVersion.split(" ").pop() : fullVersion;
    
    if (!versionGroups.has(variantLabel)) versionGroups.set(variantLabel, []);
    versionGroups.get(variantLabel).push(b);
  });

// Dibujar indicadores de variante para Starship (línea separadora y etiqueta)
  shipVersionGroups.forEach((sList, variant) => {
    const xFirst = sx.get(sList[0]);
    const xLast = sx.get(sList[sList.length - 1]);
    const xMid = (xFirst + xLast) / 2;

    // Etiqueta corta de la variante (ej. V1, V2, V3)
    add("text", {
      x: xMid,
      y: Y_STARSHIP + 26,
      "text-anchor": "middle",
      class: "small",
      style: "fill: #38bdf8; font-weight: bold; font-size: 11px; letter-spacing: 1px;"
    }, variant.toUpperCase());

    // Sub-línea horizontal indicadora del grupo
    add("path", {
      d: `M${xFirst - 10} ${Y_STARSHIP + 12} H${xLast + 10}`,
      class: "line",
      fill: "none",
      style: "stroke: #38bdf8; stroke-width: 1px; opacity: 0.4;"
    });
  });

  // Dibujar indicadores de versión (línea separadora y etiqueta corta)
  versionGroups.forEach((bList, variant) => {
    const xFirst = bx.get(bList[0]);
    const xLast = bx.get(bList[bList.length - 1]);
    const xMid = (xFirst + xLast) / 2;

    // Etiqueta de la variante (ej. V1, V2, V3)
    add("text", {
      x: xMid,
      y: Y_BOOSTER + 26,
      "text-anchor": "middle",
      class: "small",
      style: "fill: #38bdf8; font-weight: bold; font-size: 11px; letter-spacing: 1px;"
    }, variant.toUpperCase());

    // Sub-línea horizontal indicadora del grupo
    add("path", {
      d: `M${xFirst - 10} ${Y_BOOSTER + 12} H${xLast + 10}`,
      class: "line",
      style: "stroke: #38bdf8; stroke-width: 1px; opacity: 0.4;"
    });
  });

// Dibujar los nodos circulares de las Starships
  ships.forEach((x) => {
    const e = add("circle", { cx: sx.get(x), cy: Y_STARSHIP, r: 8, class: "dot shipDot node" });
    e.dataset.t = x;
    add("text", { x: sx.get(x), y: Y_STARSHIP - 14, "text-anchor": "middle", class: "label", fill: "#f8fafc" }, x);
  });

  // Dibujar los nodos circulares de los Boosters con su color dinámico
  boosters.forEach((x) => {
    const nodeColor = boosterColorMap.get(x) || "#38bdf8";
    const e = add("circle", { 
      cx: bx.get(x), 
      cy: Y_BOOSTER, 
      r: 8, 
      class: "dot boosterDot node",
      style: `fill: ${nodeColor}; stroke: #080b10; stroke-width: 2px;` 
    });
    e.dataset.t = x;
    add("text", { x: bx.get(x), y: Y_BOOSTER - 14, "text-anchor": "middle", class: "label", fill: "#f8fafc" }, x);
  });

  // Nodos de MISIONES
  M.forEach((d,i)=>{
    const x = mx.get(d.id);
    const y = my.get(d.id);
    const e = add("circle",{cx:x, cy:y, r:6, class:"dot missionDot node"});
    e.dataset.t = d.id;

    // MODIFICA ESTA LÍNEA AÑADIENDO EL ESTILO CON EL TAMAÑO DE FUENTE:
    add("text",{
      x: x + 10, 
      y: y + 3, 
      class: "label",
      fill: "#f8fafc",
      style: "font-size: 12px;" // Ajusta 12px al tamaño que prefieras (por defecto es 10px)
    }, d.mission || d.id);

    add("text",{x:x + 10, y:y + 14, class:"small"}, formatDateMMDDYYYY(d.date));
  });

  state.textContent=`${M.length} lanzamientos · ${ships.length} Starships · ${boosters.length} Boosters`;
  document.querySelector("#stamp").innerHTML = 
  ` · By <a href="https://x.com/SpaceNosey" target="_blank" style="color: #ffffff; text-decoration: none;">@SpaceNosey</a>`;

  function clear(){
    E.forEach(o=>o.e.classList.remove("on"));
    document.querySelectorAll(".node").forEach(n=>n.style.opacity=1);
  } 

  function hover(type,val,ev){
    clear();
    M.forEach(d=>{
      let ok = type==="m"? d.id===val :
               type==="s"? d.ship===val :
               type==="b"? d.booster===val :
               d.siteId===val;

      if(ok){
        E.forEach(o=>{
          if(o.m===d.id) o.e.classList.add("on");
        });
        document.querySelectorAll(".node").forEach(n=>{
          if(
            (type==="m" && n.dataset.t===d.id) ||
            (type==="s" && n.dataset.t===d.ship) ||
            (type==="b" && n.dataset.t===d.booster) ||
            (type==="site" && (n.dataset.t===d.siteId || n.dataset.t===d.id || n.dataset.t===d.ship || n.dataset.t===d.booster))
          ){
            n.style.opacity=1;
          } else {
            n.style.opacity=.18;
          }
        });
      }
    });

    if(type==="site"){
      const siteObj = Object.values(siteCoords).find(s=>s.id===val);
      const count = M.filter(d=>d.siteId===val).length;
      T.innerHTML=`<div class="tipTitle">${esc(siteObj.name)}</div><div class="tipSub">${count} Lanzamiento(s) registrados aquí</div>`;
      T.style.display="block";
      T.style.left=(ev.offsetX+18)+"px";
      T.style.top=(ev.offsetY+18)+"px";
    } else {
      const d=M.find(x=>x.id===val)||M.find(x=>x.ship===val)||M.find(x=>x.booster===val);
      if(d){
        // Determinamos el color del estado de la misión
        const statusColor = String(d.status).toLowerCase().includes("success") ? "#38ef7d" : "#ff4d4d";

        T.innerHTML=`
          <div class="tipTitle">${esc(d.mission || d.id)}</div>
          <div class="tipRow"><strong>Date:</strong> ${esc(formatDateMMDDYYYY(d.date))}</div>
          <div class="tipRow"><strong>Status:</strong> <span style="color:${statusColor}">${esc(d.status || "N/A")}</span></div>
          <div class="tipRow"><strong>Detail:</strong> ${esc(d.missionDetail || "N/A")}</div>
          <div class="tipRow"><strong>Pad:</strong> ${esc(d.pad || "N/A")}</div>
          <div class="tipRow"><strong>Landing Site:</strong> ${esc(d.landingSite || "N/A")}</div>
          <div class="tipRow"><strong>Orbit:</strong> ${esc(d.orbit || "N/A")}</div>
          <div class="tipSub" style="margin-top:4px; font-size:10px;">Booster ${esc(d.booster)} · Ship ${esc(d.ship)}</div>
        `;
        T.style.display="block";
        T.style.left=(ev.offsetX+18)+"px";
        T.style.top=(ev.offsetY+18)+"px";
      }
    }
  }

  document.querySelectorAll(".node").forEach(n=>n.addEventListener("mouseenter",e=>{
    const t = n.classList.contains("missionDot") ? "m" :
              n.classList.contains("shipDot") ? "s" :
              n.classList.contains("boosterDot") ? "b" : "site";
    hover(t, n.dataset.t, e);
  }));

  document.querySelector(".viz").addEventListener("mouseleave",()=>{clear();T.style.display="none"});
})();