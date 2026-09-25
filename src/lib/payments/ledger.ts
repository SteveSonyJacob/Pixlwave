export function completedServiceSplit(grossPaise: number, gatewayFeePaise: number) {
  if (!Number.isSafeInteger(grossPaise) || grossPaise <= 0 || !Number.isSafeInteger(gatewayFeePaise) || gatewayFeePaise < 0) {
    throw new Error("Amounts must be non-negative integer paise, with positive service value.");
  }
  const ownerPaise = Math.floor((grossPaise * 85 + 50) / 100);
  const platformGrossPaise = grossPaise - ownerPaise;
  return { ownerPaise, platformGrossPaise, gatewayFeePaise, platformNetPaise: platformGrossPaise - gatewayFeePaise };
}
