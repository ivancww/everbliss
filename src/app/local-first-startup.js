export async function startLocalFirst({ loadLocal, activateLocal, render, refreshCloud, schedule = callback => queueMicrotask(callback) }) {
  const local = await loadLocal();
  activateLocal(local);
  render();
  schedule(() => { Promise.resolve().then(refreshCloud).catch(() => {}); });
  return local;
}
