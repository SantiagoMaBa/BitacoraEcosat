export type DemoBranchOption = {
  id: string;
  clientName: string;
  branchName: string;
  location: string | null;
};

export const DEMO_BRANCH_OPTIONS: DemoBranchOption[] = [
  { id: "farmacias-del-norte/division-del-norte-201", clientName: "Farmacias del Norte", branchName: "Division del Norte 201", location: "Chihuahua, CHIH" },
  { id: "farmacias-del-norte/sucursal-aeropuerto", clientName: "Farmacias del Norte", branchName: "Sucursal Aeropuerto", location: "Chihuahua, CHIH" },
  { id: "mcdonalds/plaza-centro", clientName: "McDonalds", branchName: "Plaza Centro", location: "Chihuahua, CHIH" },
  { id: "mcdonalds/periferico", clientName: "McDonalds", branchName: "Periferico", location: "Chihuahua, CHIH" },
  { id: "emerson/planta-norte", clientName: "Emerson", branchName: "Planta Norte", location: "Chihuahua, CHIH" },
  { id: "emerson/planta-sur", clientName: "Emerson", branchName: "Planta Sur", location: "Chihuahua, CHIH" },
  { id: "carnemart/sucursal-1", clientName: "CarneMart", branchName: "Sucursal 1", location: "Chihuahua, CHIH" },
  { id: "carnemart/sucursal-2", clientName: "CarneMart", branchName: "Sucursal 2", location: "Chihuahua, CHIH" },
  { id: "chamberlain/oficinas", clientName: "Chamberlain", branchName: "Oficinas", location: "Chihuahua, CHIH" },
  { id: "chamberlain/almacen", clientName: "Chamberlain", branchName: "Almacen", location: "Chihuahua, CHIH" },
];

export function getDemoBranchById(id: string) {
  return DEMO_BRANCH_OPTIONS.find((entry) => entry.id === id) ?? null;
}

