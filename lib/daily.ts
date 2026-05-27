export function createDailyRoom() {
  const roomName = `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const roomUrl = `https://meet.jit.si/${roomName}`
  return { roomUrl, roomName }
}

export function getDailyRoom(name: string) {
  return {
    roomUrl: `https://meet.jit.si/${name}`,
    roomName: name,
    active: true,
  }
}
