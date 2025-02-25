/**
 * Formatea un nombre de platillo reemplazando guiones por espacios y capitalizando cada palabra
 * @param name Nombre del platillo con guiones
 * @returns Nombre formateado
 */
export const formatDishName = (name: string): string => {
    if (!name) return '';
    
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };