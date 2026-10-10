// Ajustes manuales de la pareja recomendada en Crianza (lo que los datos de spawn no saben del servidor).
// Usa el "slug" del Pokémon: el que sale en su URL, ej. /pokemon/mr-mime/ → 'mrmime'.

/**
 * Parejas recomendadas a mano para un Pokémon: salen primero y en este orden (la primera queda como ⭐ Recomendado).
 * La clave puede ser cualquier etapa de la familia (ralts, kirlia o gardevoir valen igual).
 * Solo se usan las que compartan grupo huevo y tengan macho y hembra.
 */
export const RECOMMENDED: Record<string, string[]> = {
  // ralts: ['meditite', 'slugma'],
};

/** Pokémon que casi no aparecen en el servidor aunque los datos digan "Común": se mandan al final de la lista. */
export const HARD_TO_FIND: string[] = [
  'shuppet',
];
