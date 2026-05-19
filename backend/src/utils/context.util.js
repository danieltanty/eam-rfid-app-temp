export function getNextBatchSeq(context) {
  if (!context.sequence) {
    context.sequence = { value: 1 };
  }

  const current = context.sequence.value;
  context.sequence.value += 1;

  return current;
}

export function getCurrentBatchSeq(context) {
  if (!context?.sequence) return 0;
  return Math.max(context.sequence.value - 1, 0);
}