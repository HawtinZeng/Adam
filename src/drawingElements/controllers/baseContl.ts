export abstract class BaseContl {
  abstract type: string
  abstract setup(...args): void;
  abstract clearSetup(...args): void;
  abstract onMousedown(...args): void;
  abstract onMousemove(...args): void;
  abstract onMouseup(...args): void;
}