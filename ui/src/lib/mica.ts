type MicaTheme = "light" | "dark";

interface CreateColorMicaOptions {
  accentColor?: string;
  height?: number;
  theme?: MicaTheme;
  width?: number;
}

function createBg(width = window.innerWidth, height = window.innerHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is not available.");
  }

  ctx.clearRect(0, 0, width, height);

  drawLinearGradient(ctx, width, height, 127, [
    [0, "#5ec1fb65"],
    [Math.SQRT1_2, "rgba(255, 0, 0, 0)"],
  ]);

  drawLinearGradient(ctx, width, height, 336, [
    [0, "#7de5f369"],
    [Math.SQRT1_2, "rgba(0, 0, 255, 0)"],
  ]);

  drawLinearGradient(ctx, width, height, 217, [
    [0, "#f1fcff36"],
    [Math.SQRT1_2, "rgba(0, 255, 0, 0)"],
  ]);

  return canvas;
}

function drawLinearGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number,
  stops: [number, string][]
) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;

  const cx = width / 2;
  const cy = height / 2;

  const length =
    Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));

  const dx = (Math.cos(angle) * length) / 2;
  const dy = (Math.sin(angle) * length) / 2;

  const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);

  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function createColorMicaTexture({
  theme = "light",
  width = window.innerWidth,
  height = window.innerHeight,
}: CreateColorMicaOptions = {}): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is not available.");
  }

  ctx.fillStyle = theme === "dark" ? "#202020" : "#f3f3f3";
  ctx.fillRect(0, 0, width, height);

  ctx.filter = "blur(150px)";

  if (theme === "dark") {
    ctx.filter = "hue-rotate(24deg) saturate(200%) brightness(40%) blur(150px)";
    ctx.globalAlpha = 0.3;
  } else {
    ctx.globalAlpha = 0.1;
  }

  ctx.drawImage(createBg(width, height), 0, 0);

  return canvas;
}

export function applyColorMica(options?: CreateColorMicaOptions): void {
  const canvas = createColorMicaTexture(options);
  const textureUrl = canvas.toDataURL("image/png");

  const micas = document.querySelectorAll<HTMLElement>(".mica");

  for (const el of micas) {
    const rect = el.getBoundingClientRect();

    el.style.backgroundImage = `url("${textureUrl}")`;
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundSize = `${canvas.width}px ${canvas.height}px`;
    el.style.backgroundPosition = `${-rect.left}px ${-rect.top}px`;
  }
}
