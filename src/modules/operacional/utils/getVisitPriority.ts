export function getVisitPriority(periodo?: string){

  if(periodo === "manha") return "alta"

  if(periodo === "almoco") return "media"

  if(periodo === "tarde") return "baixa"

  return "media"
}