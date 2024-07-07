// throttle callback to execute once per animation frame
export const throttleRAF = <T extends any[]>(
  fn: (...args: T) => void,
  opts?: { trailing?: boolean }
) => {
  let timerId: number | null = null;
  let lastArgs: T | null = null;
  let lastArgsTrailing: T | null = null;

  const scheduleFunc = (args: T) => {
    timerId = window.requestAnimationFrame(() => {
      timerId = null;
      fn(...args);
      lastArgs = null;
      if (lastArgsTrailing) {
        lastArgs = lastArgsTrailing;
        lastArgsTrailing = null;
        scheduleFunc(lastArgs);
      }
    });
  };

  const ret = (...args: T) => {
    lastArgs = args;
    if (timerId === null) {
      scheduleFunc(lastArgs);
    } else if (opts?.trailing) {
      lastArgsTrailing = args;
    }
  };

  return ret;
};

export async function* nextFrame(fps: number) {
  let then = performance.now();
  const interval = 1000 / fps;
  let delta = 0;

  while (true) {
    let now = await new Promise(requestAnimationFrame);

    if (now - then < interval - delta) continue;
    delta = Math.min(interval, delta + now - then - interval);
    then = now;

    yield now;
  }
}

export class AnimationScheduler {
  animationChanger: (...args: any[]) => void;
  status: "playing" | "end" = "end";
  fps: number = 60;

  constructor(a: (...args: any[]) => void, fps: number) {
    if (fps) this.fps = fps;
    this.animationChanger = a;
  }
  /**
   * 开始动画，不能多次开始动画，例如：第二次开启动画会被第一次屏蔽掉
   */
  start() {
    if (this.status === "playing") return;
    this.animationLoop();
    this.status = "playing";
  }
  /**
   * 启动动画循环
   */
  async animationLoop() {
    for await (const _ of nextFrame(this.fps)) {
      if (this.status === "end") return;
      this.animationChanger();
      console.log("animationChanger");
    }
  }
  /**
   * 关闭动画循环
   */
  terminate() {
    this.status = "end";
  }
}
