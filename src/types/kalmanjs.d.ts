declare module 'kalmanjs' {
    export default class KalmanFilter {
        constructor(options?: { R?: number; Q?: number; A?: number; B?: number; C?: number });
        filter(value: number, control?: number): number;
        predict(control?: number): number;
    }
}
