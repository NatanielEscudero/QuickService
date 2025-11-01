export const PROFESSIONS = [
  { id: 'plumber', name: 'Plomero', icon: '🔧', description: 'Reparaciones y instalaciones de tuberías' },
  { id: 'electrician', name: 'Electricista', icon: '⚡', description: 'Instalaciones y reparaciones eléctricas' },
  { id: 'carpenter', name: 'Carpintero', icon: '🪵', description: 'Trabajos en madera y muebles' },
  { id: 'painter', name: 'Pintor', icon: '🎨', description: 'Pintura de interiores y exteriores' },
  { id: 'cleaner', name: 'Limpieza', icon: '🧹', description: 'Limpieza residencial y comercial' },
  { id: 'gardener', name: 'Jardinero', icon: '🌿', description: 'Mantenimiento de jardines y áreas verdes' },
  { id: 'mechanic', name: 'Mecánico', icon: '🔧', description: 'Reparación de vehículos y maquinaria' },
  { id: 'technician', name: 'Técnico', icon: '💻', description: 'Reparación de equipos electrónicos' },
  { id: 'builder', name: 'Albañil', icon: '🧱', description: 'Construcción y reparaciones estructurales' },
  { id: 'installer', name: 'Instalador', icon: '📦', description: 'Instalación de muebles y equipos' },
  { id: 'welder', name: 'Soldador', icon: '🔥', description: 'Trabajos de soldadura y metalurgia' },
  { id: 'other', name: 'Otro', icon: '🔧', description: 'Otra profesión no listada' }
] as const;

export type ProfessionType = typeof PROFESSIONS[number]['id'];