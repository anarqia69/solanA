export function short(addr: string, n = 4) {
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function explorerUrl(kind: "tx" | "address", value: string, network: string) {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://solscan.io/${kind === "tx" ? "tx" : "token"}/${value}${cluster}`;
}
