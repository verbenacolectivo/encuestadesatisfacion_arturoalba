/**
 * Cuestionario de satisfacción — Formaciones grupales (Arturo Alba)
 *
 * Script vinculado a una hoja de cálculo de Google.
 *  - configurar(): prepara la hoja "Respuestas" y las hojas de análisis (se ejecuta una vez a mano).
 *  - doPost(): recibe cada cuestionario enviado desde la web y añade una fila.
 */

var HOJA = "Respuestas";

/* Solo si el script NO se creó desde Extensiones → Apps Script de la hoja:
   pega aquí el ID de la hoja (el texto largo de su URL entre /d/ y /edit). */
var ID_HOJA = "";
var CABECERA = [
  "Fecha", "Sesión", "Ciudad", "Valoración global", "Utilidad",
  "Claridad formador", "Producto recomendado", "Tema próxima formación"
];

/* ---------- Recepción de respuestas ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);

    var global = escala(d.valoracion_global);
    var utilidad = escala(d.utilidad);
    var claridad = escala(d.claridad);
    if (!global || !utilidad || !claridad) return salida("datos incompletos");

    var hoja = obtenerHojaRespuestas();
    hoja.appendRow([
      new Date(),
      limpiar(d.sesion),
      limpiar(d.ciudad),
      global,
      utilidad,
      claridad,
      limpiar(d.producto),
      limpiar(d.tema_proxima)
    ]);
    return salida("ok");
  } catch (err) {
    console.error(err);
    return salida("error: " + err.message);
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* Abrir la URL de la implementación en el navegador sirve para comprobar que está activa */
function doGet() {
  try {
    return salida("activo v2-ciudad, hoja vinculada: " + obtenerHoja().getName());
  } catch (err) {
    return salida("activo v2-ciudad, pero SIN hoja vinculada: " + err.message);
  }
}

/* Para probar desde el editor: elige "prueba" y pulsa Ejecutar.
   Debe aparecer una fila de prueba en la pestaña Respuestas. */
function prueba() {
  obtenerHojaRespuestas().appendRow([new Date(), "PRUEBA", 10, 10, 10, "Producto de prueba", "Fila de prueba, bórrala"]);
}

function escala(v) {
  var n = parseInt(v, 10);
  return (n >= 1 && n <= 10) ? n : null;
}

/* Recorta el texto y evita que una celda se interprete como fórmula */
function limpiar(t) {
  t = String(t || "").trim().substring(0, 500);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function salida(estado) {
  return ContentService
    .createTextOutput(JSON.stringify({ estado: estado }))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerHoja() {
  var ss = SpreadsheetApp.getActive() || (ID_HOJA ? SpreadsheetApp.openById(ID_HOJA) : null);
  if (!ss) throw new Error("El script no está vinculado a ninguna hoja de cálculo");
  return ss;
}

function obtenerHojaRespuestas() {
  var ss = obtenerHoja();
  var hoja = ss.getSheetByName(HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA, 0);
    prepararRespuestas(hoja);
  }
  return hoja;
}

function prepararRespuestas(hoja) {
  hoja.getRange(1, 1, 1, CABECERA.length).setValues([CABECERA])
    .setFontWeight("bold").setBackground("#ff6b00").setFontColor("#ffffff");
  hoja.setFrozenRows(1);
  hoja.getRange("A2:A").setNumberFormat("dd/mm/yyyy hh:mm");
  hoja.getRange("D2:F").setNumberFormat("0");
  hoja.setColumnWidth(1, 130);
  hoja.setColumnWidth(2, 170);
  hoja.setColumnWidth(3, 150);
  hoja.setColumnWidths(4, 3, 120);
  hoja.setColumnWidth(7, 320);
  hoja.setColumnWidth(8, 420);
}

/* ---------- Configuración inicial + hojas de análisis ---------- */

function configurar() {
  var ss = obtenerHoja();

  var resp = ss.getSheetByName(HOJA);
  if (!resp) {
    resp = ss.getSheets()[0];
    resp.setName(HOJA);
  }
  prepararRespuestas(resp);

  /* Resumen: totales + media por sesión */
  var res = recrear(ss, "Resumen");
  res.getRange("A1").setValue("RESUMEN GENERAL").setFontWeight("bold");
  res.getRange("A2:A6").setValues([
    ["Total de respuestas"],
    ["Valoración global media (1-10)"],
    ["Utilidad media (1-10)"],
    ["Claridad y dominio del formador, media (1-10)"],
    ["Objetivo: valoración global media ≥ 8"]
  ]);
  res.getRange("B2").setFormula('=COUNT(Respuestas!D2:D)');
  res.getRange("B3").setFormula('=IFERROR(AVERAGE(Respuestas!D2:D),"")');
  res.getRange("B4").setFormula('=IFERROR(AVERAGE(Respuestas!E2:E),"")');
  res.getRange("B5").setFormula('=IFERROR(AVERAGE(Respuestas!F2:F),"")');
  res.getRange("B6").setFormula('=IF(B3="","",IF(B3>=8,"Cumplido","No cumplido"))');
  res.getRange("B3:B5").setNumberFormat("0.00");

  res.getRange("A8").setValue("POR SESIÓN (nº de respuestas y medias)").setFontWeight("bold");
  res.getRange("A9").setFormula(
    '=IFERROR(QUERY(Respuestas!A:H,"select B, count(D), avg(D), avg(E), avg(F) ' +
    'where B is not null and B <> \'\' group by B ' +
    'label B \'Sesión\', count(D) \'Nº respuestas\', avg(D) \'Valoración global\', ' +
    'avg(E) \'Utilidad\', avg(F) \'Claridad formador\'",1),"Aún no hay respuestas con sesión")'
  );
  res.getRange("C10:E200").setNumberFormat("0.00");
  res.setColumnWidth(1, 330);
  res.setColumnWidths(2, 4, 140);

  /* Ciudades: respuestas y medias por ciudad */
  var ciu = recrear(ss, "Ciudades");
  ciu.getRange("A1").setFormula(
    '=IFERROR(QUERY(Respuestas!A:H,"select C, count(D), avg(D), avg(E), avg(F) ' +
    'where C is not null and C <> \'\' group by C order by count(D) desc ' +
    'label C \'Ciudad\', count(D) \'Nº respuestas\', avg(D) \'Valoración global\', ' +
    'avg(E) \'Utilidad\', avg(F) \'Claridad formador\'",1),"Aún no hay respuestas")'
  );
  ciu.getRange("C2:E200").setNumberFormat("0.00");
  ciu.setColumnWidth(1, 220);
  ciu.setColumnWidths(2, 4, 140);

  /* Productos: ranking de productos recomendados */
  var pro = recrear(ss, "Productos");
  pro.getRange("A1").setFormula(
    '=IFERROR(QUERY(Respuestas!G2:G,"select G, count(G) where G is not null and G <> \'\' ' +
    'group by G order by count(G) desc label G \'Producto recomendado\', count(G) \'Veces elegido\'",0),' +
    '"Aún no hay respuestas")'
  );
  pro.setColumnWidth(1, 420);
  pro.setColumnWidth(2, 130);
  try {
    var grafico = pro.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(pro.getRange("A1:B26"))
      .setPosition(2, 4, 0, 0)
      .setOption("title", "Producto que más se ven capaces de recomendar")
      .setOption("legend", { position: "none" })
      .setOption("colors", ["#ff6b00"])
      .setOption("width", 640)
      .setOption("height", 560)
      .build();
    pro.insertChart(grafico);
  } catch (e) {}

  /* Temas: respuestas abiertas */
  var tem = recrear(ss, "Temas");
  tem.getRange("A1").setFormula(
    '=IFERROR(QUERY(Respuestas!A:H,"select A, B, C, H where H is not null and H <> \'\' ' +
    'order by A desc label A \'Fecha\', B \'Sesión\', C \'Ciudad\', H \'Tema propuesto\'",1),"Aún no hay respuestas")'
  );
  tem.getRange("A2:A").setNumberFormat("dd/mm/yyyy hh:mm");
  tem.setColumnWidth(1, 130);
  tem.setColumnWidth(2, 170);
  tem.setColumnWidth(3, 150);
  tem.setColumnWidth(4, 520);

  SpreadsheetApp.flush();
}

function recrear(ss, nombre) {
  var h = ss.getSheetByName(nombre);
  if (h) ss.deleteSheet(h);
  return ss.insertSheet(nombre);
}
