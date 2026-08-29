export const stableSelectors = {
  title: ['[data-testid="vip-ad-title"]', '[data-testid="vip-title"]', 'h1'],
  description: ['[data-testid="vip-vehicle-description-text"]', '[data-testid="vip-vehicle-description"]'],
  technical: ['[data-testid="vip-technical-data-box"]'],
  features: ['[data-testid="vip-features"]'],
  seller: ['[data-testid="vip-key-features-seller-seller-name"]'],
} as const;

export const technicalTestIds = {
  mileageKm: 'mileage-item', power: 'power-item', fuel: 'fuel-item', transmission: 'transmission-item',
  firstRegistration: 'firstRegistration-item', owners: 'numberOfPreviousOwners-item', modelRange: 'modelRange-item',
  trim: 'trimLine-item', displacementCc: 'cubicCapacity-item', co2Gkm: 'envkv.co2Emissions-item', doors: 'doorCount-item',
  emissionClass: 'emissionClass-item', cylinders: 'cylinder-item', tankLitres: 'fuelTankVolume-item',
} as const;

export const fieldAliases: Record<string, readonly string[]> = {
  mileageKm: ['kilometraje', 'kilometerstand', 'mileage'],
  power: ['potencia', 'leistung', 'power'],
  fuel: ['combustible', 'kraftstoff', 'fuel type', 'fuel'],
  transmission: ['transmisión', 'getriebe', 'transmission'],
  firstRegistration: ['primera matriculación', 'primer registro', 'erstzulassung', 'first registration'],
  owners: ['propietarios', 'fahrzeughalter', 'owners'],
  modelRange: ['gama de modelos', 'baureihe', 'model range'],
  trim: ['línea de acabado', 'línea de recorte', 'ausstattungslinie', 'trim'],
  displacementCc: ['cilindrada', 'capacidad cúbica', 'hubraum', 'engine size'],
  co2Gkm: ['emisiones de co₂', 'co2-emissionen', 'co₂ emissions', 'co2 emissions'],
  doors: ['número de puertas', 'anzahl der türen', 'number of doors', 'doors'],
  emissionClass: ['clase de emisiones', 'clase de emisión', 'schadstoffklasse', 'emission class'],
  cylinders: ['cilindros', 'cylinder', 'zylinder', 'cylinders'],
  tankLitres: ['volumen del depósito', 'tankinhalt', 'tank volume'],
};
