let suppressUntil = 0;

export function suppressPointerClicksFor(ms = 450) {
  suppressUntil = Date.now() + ms;
}

export function shouldSuppressPointerClick() {
  return Date.now() < suppressUntil;
}
