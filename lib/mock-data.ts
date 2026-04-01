export type Tone = "success" | "info" | "warning" | "neutral";

export type Report = {
  id: string;
  folio: string;
  client: string;
  branch: string;
  technician: string;
  supervisor: string;
  date: string;
  timeRange: string;
  serviceType: string;
  status: string;
  tone: Tone;
  summary: string;
  activities: string[];
  findings: string[];
  pending: string[];
  purchases: string[];
  evidences: Array<{
    name: string;
    type: string;
  }>;
  signatures: {
    technician: string;
    client: string;
    clientName: string;
  };
};

export const dailyMetrics = [
  {
    label: "Reportes hoy",
    value: "12",
    detail: "+3 vs ayer",
    tone: "success" as Tone,
  },
  {
    label: "Pendientes abiertos",
    value: "7",
    detail: "2 criticos",
    tone: "warning" as Tone,
  },
  {
    label: "Actas firmadas",
    value: "9",
    detail: "75% cierre",
    tone: "info" as Tone,
  },
  {
    label: "Tiempo captura",
    value: "01:42",
    detail: "objetivo PRD",
    tone: "success" as Tone,
  },
];

export const reports: Report[] = [
  {
    id: "bt-24031",
    folio: "BT-24031",
    client: "Farmacias del Norte",
    branch: "Division del Norte 201",
    technician: "Eduardo Ibarra",
    supervisor: "Daniela Mendez",
    date: "01 Apr 2026",
    timeRange: "09:10 - 11:00",
    serviceType: "Mantenimiento preventivo CCTV",
    status: "Listo para firma",
    tone: "info",
    summary:
      "Se realizo mantenimiento preventivo en DVR, limpieza de camaras y ajuste de respaldo. Se detecto degradacion en una fuente PoE.",
    activities: [
      "Limpieza fisica de 8 camaras y gabinete principal.",
      "Revision de grabacion historica y estado SMART del DVR.",
      "Ajuste de conectores en rack de comunicaciones.",
    ],
    findings: [
      "La fuente PoE del pasillo norte entrega voltaje inestable.",
      "Una camara exterior muestra perdida intermitente por humedad.",
    ],
    pending: [
      "Reemplazar fuente PoE de 8 puertos.",
      "Sellar housing de camara exterior.",
    ],
    purchases: [
      "1 fuente PoE administrable",
      "Kit de sellado para housing exterior",
    ],
    evidences: [
      { name: "camara-exterior-norte.jpg", type: "foto" },
      { name: "rack-principal.jpg", type: "foto" },
      { name: "audio-resumen.m4a", type: "audio" },
    ],
    signatures: {
      technician: "Firmado por Eduardo Ibarra a las 11:12",
      client: "Pendiente de firma digital en sitio",
      clientName: "Laura Gomez",
    },
  },
  {
    id: "bt-24032",
    folio: "BT-24032",
    client: "Hospital Santa Elena",
    branch: "Torre B urgencias",
    technician: "Jesus Carrillo",
    supervisor: "Daniela Mendez",
    date: "01 Apr 2026",
    timeRange: "11:40 - 13:20",
    serviceType: "Revision de control de acceso",
    status: "Pendiente cliente",
    tone: "warning",
    summary:
      "Se normalizo la lectura en acceso principal, pero queda pendiente autorizacion para cambio de boton de salida.",
    activities: [
      "Calibracion de lector biometrico y limpieza del sensor.",
      "Prueba de apertura con credenciales del personal.",
    ],
    findings: [
      "Boton de salida presenta desgaste mecanico.",
      "Un usuario sin enrolamiento actualizado genero falsa alarma.",
    ],
    pending: [
      "Cambiar boton de salida",
      "Actualizar base de usuarios del turno nocturno",
    ],
    purchases: ["1 boton de salida metalico"],
    evidences: [
      { name: "lector-principal.jpg", type: "foto" },
      { name: "prueba-acceso.mp4", type: "video" },
    ],
    signatures: {
      technician: "Firmado por Jesus Carrillo a las 13:25",
      client: "Pendiente validacion de mantenimiento",
      clientName: "Martha Solis",
    },
  },
  {
    id: "bt-24033",
    folio: "BT-24033",
    client: "Plaza Comercial Arboledas",
    branch: "Centro de monitoreo",
    technician: "Luis Ortega",
    supervisor: "Daniela Mendez",
    date: "01 Apr 2026",
    timeRange: "14:00 - 16:10",
    serviceType: "Diagnostico enlace inalambrico",
    status: "Cerrado",
    tone: "success",
    summary:
      "Se estabilizo el enlace inalambrico despues de corregir alineacion y reemplazar conectores dañados.",
    activities: [
      "Alineacion fina de antena punto a punto.",
      "Reemplazo de conectores oxidados y prueba de throughput.",
    ],
    findings: [
      "Oxidacion en conectores por exposicion al clima.",
      "Perdida de 18% de paquetes antes del ajuste.",
    ],
    pending: ["Programar mantenimiento semestral de conectores"],
    purchases: ["2 conectores blindados RJ45 exterior"],
    evidences: [
      { name: "alineacion-antena.jpg", type: "foto" },
      { name: "medicion-throughput.pdf", type: "pdf" },
    ],
    signatures: {
      technician: "Firmado por Luis Ortega a las 16:14",
      client: "Firmado por Marco Salgado a las 16:18",
      clientName: "Marco Salgado",
    },
  },
];

export const routeStops = [
  {
    branch: "Division del Norte 201",
    client: "Farmacias del Norte",
    status: "En revision",
    tone: "info" as Tone,
  },
  {
    branch: "Torre B urgencias",
    client: "Hospital Santa Elena",
    status: "Pendiente cliente",
    tone: "warning" as Tone,
  },
  {
    branch: "Centro de monitoreo",
    client: "Plaza Comercial Arboledas",
    status: "Cerrado",
    tone: "success" as Tone,
  },
];

export const moduleCards = [
  {
    kicker: "M1-M2",
    title: "Administracion y captura",
    description:
      "La base contempla clientes, sucursales, tecnico-supervisor y captura operativa directa desde movil.",
    points: [
      "Asignacion de tecnico a supervisor",
      "Cliente y sucursal obligatorios",
      "Entrada por voz o texto",
    ],
  },
  {
    kicker: "M3-M5",
    title: "Estructura IA y acta",
    description:
      "El flujo prepara speech-to-text, parsing semantico y una salida printable para acta formal de servicio.",
    points: [
      "Resumen obligatorio",
      "Pendientes y compras separados",
      "Vista de acta lista para PDF",
    ],
  },
  {
    kicker: "M6-M8",
    title: "Firmas, compartir y supervision",
    description:
      "Se deja lista la experiencia para doble firma, bloqueo por version y tablero ejecutivo del supervisor.",
    points: [
      "Firma tecnico y cliente",
      "Share link o descarga",
      "Reportes y pendientes del dia",
    ],
  },
];

export const architectureStack = [
  {
    layer: "Frontend",
    title: "Next.js app router",
    description:
      "Base preparada para evolucionar a PWA con sesiones, formularios y consumo de API REST.",
  },
  {
    layer: "Backend",
    title: "NestJS + API de reportes",
    description:
      "Servicios para usuarios, catalogos, reportes, firmas, auditoria y permisos por rol.",
  },
  {
    layer: "IA",
    title: "Whisper + parser LLM",
    description:
      "Transcripcion, clasificacion de actividades y extraccion estructurada con fallback a texto libre.",
  },
  {
    layer: "Storage",
    title: "PostgreSQL + blob storage",
    description:
      "Persistencia de reportes y evidencias con versionado de acta y control de firmas.",
  },
];

export const captureDraft =
  "Llegue a la sucursal a las 9:10, revise las camaras del pasillo norte y detecte una fuente PoE inestable. Limpie gabinete, valide grabacion del DVR y deje pendiente el reemplazo de la fuente y el sellado del housing exterior.";

export const generatedJsonPreview = {
  resumen:
    "Mantenimiento preventivo completado con un pendiente critico de energia PoE y una recomendacion de sellado exterior.",
  actividades: [
    "Limpieza de camaras y gabinete principal",
    "Validacion de grabacion historica",
    "Ajuste de conectores en rack",
  ],
  hallazgos: [
    "Fuente PoE con voltaje inestable",
    "Ingreso de humedad en housing exterior",
  ],
  pendientes: [
    "Reemplazar fuente PoE",
    "Programar sellado del housing exterior",
  ],
  compras: ["Fuente PoE administrable", "Kit de sellado exterior"],
};

export const captureChecklist = [
  {
    title: "Cliente y sucursal",
    description: "Campos obligatorios completos para generar folio.",
    state: "ok",
  },
  {
    title: "Audio procesado",
    description: "Transcripcion disponible para revision manual.",
    state: "ok",
  },
  {
    title: "Pendientes detectados",
    description: "Se requiere reemplazo de fuente antes del cierre.",
    state: "warn",
  },
];

export const suggestedEvidence = [
  {
    type: "Foto",
    name: "Camara exterior norte",
    caption: "Muestra humedad y sellado deteriorado.",
  },
  {
    type: "Foto",
    name: "Rack principal",
    caption: "Conectores ajustados despues del servicio.",
  },
  {
    type: "Audio",
    name: "Resumen del tecnico",
    caption: "Narrativa original para auditoria y soporte.",
  },
];

export const supervisorFilters = [
  { label: "Tecnico", value: "Todos" },
  { label: "Cliente", value: "Activos" },
  { label: "Fecha", value: "Hoy" },
  { label: "Sucursal", value: "3 en ruta" },
];

export const pendingBoard = [
  {
    title: "Autorizar compra de fuente PoE",
    description:
      "Necesaria para cerrar el reporte BT-24031 sin riesgo de caida en pasillo norte.",
    owner: "Compras",
    deadline: "Resolver hoy antes de las 18:00",
    tone: "warning" as Tone,
  },
  {
    title: "Confirmar firma cliente BT-24032",
    description:
      "El servicio esta listo, pero mantenimiento interno debe revisar el boton de salida.",
    owner: "Cliente",
    deadline: "Seguimiento mañana 09:00",
    tone: "info" as Tone,
  },
  {
    title: "Programar mantenimiento preventivo",
    description:
      "El enlace inalambrico quedo estable; se recomienda orden recurrente semestral.",
    owner: "Supervisor",
    deadline: "Agregar al calendario semanal",
    tone: "success" as Tone,
  },
];

export function getReportById(id: string) {
  return reports.find((report) => report.id === id);
}
