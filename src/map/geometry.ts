export const CX = 500, CY = 280, RX = 415, RY = 207;

export const ELLIPSE = `M${CX - RX} ${CY} A${RX} ${RY} 0 1 0 ${CX + RX} ${CY} A${RX} ${RY} 0 1 0 ${CX - RX} ${CY} Z`;

export const sideOf = (dy: number) => `M${CX - RX} ${CY} A${RX} ${RY} 0 0 0 ${CX + RX} ${CY} L${CX + RX} ${CY + dy} A${RX} ${RY} 0 0 1 ${CX - RX} ${CY + dy} Z`;
