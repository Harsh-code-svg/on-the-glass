import { createContext, useContext } from "react";

export interface StageApi {
  /** Screen (client) coordinates → door coordinates. */
  toDoor: (clientX: number, clientY: number) => { x: number; y: number };
}

export const StageContext = createContext<StageApi>({ toDoor: (x, y) => ({ x, y }) });
export const useStage = () => useContext(StageContext);
